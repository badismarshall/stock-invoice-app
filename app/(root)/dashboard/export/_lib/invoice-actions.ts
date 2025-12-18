"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { 
  invoice, 
  invoiceItem, 
  partner, 
  product, 
  stockCurrent, 
  stockMovement 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";

// Note: Invoices do not affect stock. Only delivery_notes affect stock.
// Stock updates are handled when delivery notes are created/received.

export async function addInvoice(input: {
  invoiceNumber?: string;
  invoiceType: "sale_local" | "sale_export" | "proforma" | "purchase";
  clientId: string;
  invoiceDate: Date;
  dueDate?: Date;
  status?: string;
  paymentStatus?: string;
  currency?: string;
  destinationCountry?: string;
  deliveryLocation?: string;
  deliveryNoteId?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxRate?: number;
    lineSubtotal: number;
    lineTax: number;
    lineTotal: number;
  }>;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    if (!input.items || input.items.length === 0) {
      return {
        data: null,
        error: "Veuillez ajouter au moins un produit",
      };
    }

    // Generate invoice number automatically if not provided
    const { generateInvoiceNumber } = await import("@/lib/utils/invoice-number-generator");
    let invoiceNumber = input.invoiceNumber || generateInvoiceNumber(input.invoiceType);
    
    // Check if invoice number already exists and regenerate if needed
    let attempts = 0;
    while (attempts < 10) {
      const existingInvoice = await db
        .select({ id: invoice.id })
        .from(invoice)
        .where(eq(invoice.invoiceNumber, invoiceNumber))
        .limit(1)
        .execute();

      if (existingInvoice.length === 0) {
        break; // Number is unique
      }
      
      // Regenerate if exists
      invoiceNumber = generateInvoiceNumber(input.invoiceType);
      attempts++;
    }

    if (attempts >= 10) {
      return {
        data: null,
        error: "Impossible de générer un numéro unique. Veuillez réessayer.",
      };
    }

    const id = generateId();

    await db.transaction(async (tx) => {
      // Convert Date to string format YYYY-MM-DD for PostgreSQL date type
      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const invoiceDateValue = input.invoiceDate instanceof Date 
        ? formatDateLocal(input.invoiceDate)
        : formatDateLocal(new Date(input.invoiceDate));

      const dueDateValue = input.dueDate 
        ? (input.dueDate instanceof Date 
            ? formatDateLocal(input.dueDate)
            : formatDateLocal(new Date(input.dueDate)))
        : null;

      // Calculate totals
      if (!input.items || input.items.length === 0) {
        throw new Error("Veuillez ajouter au moins un produit");
      }

      const subtotal = input.items.reduce((sum, item) => sum + item.lineSubtotal, 0);
      const taxAmount = input.items.reduce((sum, item) => sum + item.lineTax, 0);
      const totalAmount = input.items.reduce((sum, item) => sum + item.lineTotal, 0);

      // Insert invoice
      await tx.insert(invoice).values({
        id,
        invoiceNumber: invoiceNumber,
        invoiceType: input.invoiceType,
        clientId: input.clientId,
        invoiceDate: invoiceDateValue,
        dueDate: dueDateValue,
        status: (input.status as "active" | "cancelled") || "active",
        paymentStatus: (input.paymentStatus as "unpaid" | "partially_paid" | "paid") || "unpaid",
        currency: input.currency || "DZD",
        destinationCountry: input.destinationCountry || null,
        deliveryLocation: input.deliveryLocation || null,
        deliveryNoteId: input.deliveryNoteId || null,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes: input.notes || null,
        createdBy: user.id,
      });

      // Insert invoice items
      const itemsToInsert = input.items.map((item) => ({
        id: generateId(),
        invoiceId: id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: (item.discountPercent || 0).toString(),
        taxRate: (item.taxRate || 0).toString(),
        lineSubtotal: item.lineSubtotal.toString(),
        lineTax: item.lineTax.toString(),
        lineTotal: item.lineTotal.toString(),
      }));

      await tx.insert(invoiceItem).values(itemsToInsert);

      // Note: Invoices do not affect stock. Only delivery_notes affect stock.
    });

    updateTag("invoices");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding invoice", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getAllClients() {
  try {
    const clients = await db
      .select({
        id: partner.id,
        name: partner.name,
      })
      .from(partner)
      .where(eq(partner.type, "client"));

    return {
      data: clients,
      error: null,
    };
  } catch (err) {
    console.error("Error getting clients", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

export async function getAllActiveProducts() {
  try {
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        code: product.code,
        salePriceLocal: product.salePriceLocal,
        salePriceExport: product.salePriceExport,
        taxRate: product.taxRate,
        unitOfMeasure: product.unitOfMeasure,
      })
      .from(product)
      .where(eq(product.isActive, true));

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        salePriceLocal: p.salePriceLocal ? parseFloat(p.salePriceLocal) : null,
        salePriceExport: p.salePriceExport ? parseFloat(p.salePriceExport) : null,
        taxRate: p.taxRate ? parseFloat(p.taxRate) : 0,
        unitOfMeasure: p.unitOfMeasure,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting active products", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}


