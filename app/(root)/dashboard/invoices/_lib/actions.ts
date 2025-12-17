"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { partner, invoice, invoiceItem, product, purchaseOrder, companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";

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
    console.error("Error getting all clients", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

export async function getAllSuppliers() {
  try {
    const suppliers = await db
      .select({
        id: partner.id,
        name: partner.name,
      })
      .from(partner)
      .where(eq(partner.type, "fournisseur"));

    return {
      data: suppliers,
      error: null,
    };
  } catch (err) {
    console.error("Error getting all suppliers", err);
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
        purchasePrice: product.purchasePrice,
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
        purchasePrice: parseFloat(p.purchasePrice || "0"),
        salePriceLocal: p.salePriceLocal ? parseFloat(p.salePriceLocal) : null,
        salePriceExport: p.salePriceExport ? parseFloat(p.salePriceExport) : null,
        taxRate: parseFloat(p.taxRate || "0"),
        unitOfMeasure: p.unitOfMeasure || "unité",
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting all active products", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

// Note: Invoices do not affect stock. Only delivery_notes affect stock.
// Stock updates are handled when delivery notes are created/received.

export async function addInvoice(input: {
  invoiceNumber: string;
  invoiceType: "sale_local" | "sale_export" | "proforma" | "purchase" | "sale_invoice" | "delivery_note_invoice";
  clientId?: string;
  supplierId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  status?: string;
  paymentStatus?: string;
  currency?: string;
  destinationCountry?: string;
  deliveryLocation?: string;
  deliveryNoteId?: string;
  purchaseOrderId?: string;
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
        clientId: input.clientId || null,
        supplierId: input.supplierId || null,
        invoiceDate: invoiceDateValue,
        dueDate: dueDateValue,
        status: (input.status as "active" | "cancelled") || "active",
        paymentStatus: (input.paymentStatus as "unpaid" | "partially_paid" | "paid") || "unpaid",
        currency: input.currency || "DZD",
        destinationCountry: input.destinationCountry || null,
        deliveryLocation: input.deliveryLocation || null,
        deliveryNoteId: input.deliveryNoteId || null,
        purchaseOrderId: input.purchaseOrderId || null,
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

export async function getInvoiceById(input: { id: string }) {
  try {
    const result = await db
      .select({
        invoice: invoice,
        supplier: {
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          email: partner.email,
          address: partner.address,
          nif: partner.nif,
          rc: partner.rc,
        },
      })
      .from(invoice)
      .leftJoin(partner, eq(invoice.supplierId, partner.id))
      .where(eq(invoice.id, input.id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return {
        data: null,
        error: "Facture non trouvée",
      };
    }

    const item = result[0];

    // Get client info if exists
    let clientInfo = null;
    if (item.invoice.clientId) {
      const clientResult = await db
        .select({
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          email: partner.email,
          address: partner.address,
          nif: partner.nif,
          rc: partner.rc,
        })
        .from(partner)
        .where(eq(partner.id, item.invoice.clientId))
        .limit(1)
        .execute();
      
      if (clientResult.length > 0) {
        clientInfo = clientResult[0];
      }
    }

    // Get purchase order info if invoice is linked to a purchase order
    let purchaseOrderInfo = null;
    if (item.invoice.purchaseOrderId) {
      const purchaseOrderResult = await db
        .select({
          id: purchaseOrder.id,
          orderNumber: purchaseOrder.orderNumber,
          orderDate: purchaseOrder.orderDate,
          receptionDate: purchaseOrder.receptionDate,
          status: purchaseOrder.status,
        })
        .from(purchaseOrder)
        .where(eq(purchaseOrder.id, item.invoice.purchaseOrderId))
        .limit(1)
        .execute();
      
      if (purchaseOrderResult.length > 0) {
        const po = purchaseOrderResult[0];
        purchaseOrderInfo = {
          id: po.id,
          orderNumber: po.orderNumber,
          orderDate: typeof po.orderDate === 'string'
            ? new Date(po.orderDate + 'T00:00:00')
            : po.orderDate,
          receptionDate: po.receptionDate
            ? (typeof po.receptionDate === 'string'
                ? new Date(po.receptionDate + 'T00:00:00')
                : po.receptionDate)
            : null,
          status: po.status,
        };
      }
    }

    // Get invoice items with product info
    const items = await db
      .select({
        item: invoiceItem,
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
          description: product.description,
        },
      })
      .from(invoiceItem)
      .leftJoin(product, eq(invoiceItem.productId, product.id))
      .where(eq(invoiceItem.invoiceId, input.id))
      .orderBy(invoiceItem.id);

    // Format dates
    const invoiceDate = typeof item.invoice.invoiceDate === 'string'
      ? new Date(item.invoice.invoiceDate + 'T00:00:00')
      : item.invoice.invoiceDate;
    const dueDate = item.invoice.dueDate
      ? (typeof item.invoice.dueDate === 'string'
          ? new Date(item.invoice.dueDate + 'T00:00:00')
          : item.invoice.dueDate)
      : null;

    return {
      data: {
        id: item.invoice.id,
        invoiceNumber: item.invoice.invoiceNumber,
        invoiceType: item.invoice.invoiceType,
        supplier: item.supplier,
        client: clientInfo,
        purchaseOrder: purchaseOrderInfo,
        invoiceDate,
        dueDate,
        currency: item.invoice.currency || "DZD",
        subtotal: parseFloat(item.invoice.subtotal || "0"),
        taxAmount: parseFloat(item.invoice.taxAmount || "0"),
        totalAmount: parseFloat(item.invoice.totalAmount || "0"),
        paymentStatus: item.invoice.paymentStatus || "unpaid",
        notes: item.invoice.notes,
        destinationCountry: item.invoice.destinationCountry,
        deliveryLocation: item.invoice.deliveryLocation,
        items: items.map((i) => ({
          id: i.item.id,
          productId: i.item.productId,
          productName: i.product?.name || null,
          productCode: i.product?.code || null,
          productDescription: i.product?.description || null,
          quantity: parseFloat(i.item.quantity),
          unitPrice: parseFloat(i.item.unitPrice),
          discountPercent: parseFloat(i.item.discountPercent || "0"),
          taxRate: parseFloat(i.item.taxRate || "0"),
          lineSubtotal: parseFloat(i.item.lineSubtotal),
          lineTax: parseFloat(i.item.lineTax),
          lineTotal: parseFloat(i.item.lineTotal),
        })),
      },
      error: null,
    };
  } catch (err) {
    console.error("Error getting invoice by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getCompanySettings() {
  try {
    // Get company settings (single row table with id = "1")
    const result = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.id, "1"))
      .limit(1)
      .execute();

    if (result.length === 0) {
      // Return default values if no settings exist
      return {
        data: {
          id: "1",
          name: "Sirof Algeria",
          address: "Adresse de l'entreprise",
          phone: "+213 555 55 55 55",
          email: "contact@sirof.dz",
          nif: "1234567890",
          rc: "1234567890",
          logo: "/logo.png",
        },
        error: null,
      };
    }

    return {
      data: result[0],
      error: null,
    };
  } catch (err) {
    console.error("Error getting company settings", err);
    // Return default values on error
    return {
      data: {
        id: "1",
        name: "Sirof Algeria",
        address: "Adresse de l'entreprise",
        phone: "+213 555 55 55 55",
        email: "contact@sirof.dz",
        nif: "1234567890",
        rc: "1234567890",
        logo: "/logo.png",
      },
      error: getErrorMessage(err),
    };
  }
}

export async function updateCompanySettings(input: {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  nif?: string | null;
  rc?: string | null;
  logo?: string | null;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Check if settings exist
    const existing = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.id, "1"))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      // Create new settings
      await db.insert(companySettings).values({
        id: "1",
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
        email: input.email || null,
        nif: input.nif || null,
        rc: input.rc || null,
        logo: input.logo || null,
      });
    } else {
      // Update existing settings
      await db
        .update(companySettings)
        .set({
          name: input.name,
          address: input.address || null,
          phone: input.phone || null,
          email: input.email || null,
          nif: input.nif || null,
          rc: input.rc || null,
          logo: input.logo || null,
        })
        .where(eq(companySettings.id, "1"));
    }

    updateTag("companySettings");

    return {
      data: { id: "1" },
      error: null,
    };
  } catch (err) {
    console.error("Error updating company settings", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
