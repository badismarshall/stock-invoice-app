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

/**
 * Helper function to update stock when invoice items are added (for sale invoices only)
 * Proforma invoices don't affect stock
 */
async function updateStockFromInvoice(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  items: Array<{
    productId: string;
    quantity: number;
  }>,
  movementDate: string,
  referenceId: string,
  userId: string,
  invoiceType: "sale_local" | "sale_export" | "proforma" | "purchase",
  isReversal: boolean = false
) {
  // Proforma invoices don't affect stock
  if (invoiceType === "proforma") {
    return;
  }

  for (const item of items) {
    // Check if product exists
    const productExists = await tx
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, item.productId))
      .limit(1);

    if (productExists.length === 0) {
      throw new Error(`Produit avec l'ID ${item.productId} non trouvé`);
    }

    // Get current stock
    const existingStock = await tx
      .select()
      .from(stockCurrent)
      .where(eq(stockCurrent.productId, item.productId))
      .limit(1);

    if (existingStock.length === 0) {
      throw new Error(
        `Produit ${item.productId} n'existe pas en stock`
      );
    }

    const movementId = generateId();
    const currentStock = existingStock[0];
    const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
    const currentAverageCost = parseFloat(currentStock.averageCost || "0");
    const quantityChange = isReversal ? item.quantity : -item.quantity;
    const newQuantity = currentQuantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error(
        `Quantité insuffisante en stock pour le produit ${item.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${Math.abs(quantityChange)}`
      );
    }

    // Create stock movement (out)
    await tx.insert(stockMovement).values({
      id: movementId,
      productId: item.productId,
      movementType: "out",
      movementSource: invoiceType === "sale_local" ? "sale_local" : "sale_export",
      referenceType: "invoice",
      referenceId: referenceId,
      quantity: item.quantity.toString(),
      unitCost: currentAverageCost.toString(),
      movementDate: movementDate,
      notes: isReversal 
        ? `Annulation de la facture ${referenceId}`
        : `Sortie pour facture ${referenceId}`,
      createdBy: userId,
    });

    // Update stock_current
    await tx
      .update(stockCurrent)
      .set({
        quantityAvailable: newQuantity.toString(),
        averageCost: currentAverageCost.toFixed(2),
        lastMovementDate: movementDate,
        lastUpdated: new Date(),
      })
      .where(eq(stockCurrent.productId, item.productId));
  }
}

export async function addInvoice(input: {
  invoiceNumber: string;
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

    // Check if invoice number already exists
    const existingInvoice = await db
      .select({ id: invoice.id })
      .from(invoice)
      .where(eq(invoice.invoiceNumber, input.invoiceNumber))
      .limit(1)
      .execute();

    if (existingInvoice.length > 0) {
      return {
        data: null,
        error: `Le numéro de facture "${input.invoiceNumber}" existe déjà. Veuillez utiliser un numéro différent.`,
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
        invoiceNumber: input.invoiceNumber,
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

      // Update stock (only for sale invoices, not proforma)
      if (input.invoiceType === "sale_local" || input.invoiceType === "sale_export") {
        await updateStockFromInvoice(
          tx,
          input.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          invoiceDateValue,
          id,
          user.id,
          input.invoiceType,
          false
        );
      }
    });

    updateTag("invoices");
    updateTag("stock");
    updateTag("stockMovements");

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


