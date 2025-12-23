"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { invoice, invoiceItem, payment, partner } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import { getInvoiceById } from "@/app/(root)/dashboard/invoices/_lib/actions";

/**
 * Delete a proforma invoice
 * This deletes associated payments, invoice items, and the invoice itself
 */
export async function deleteProformaInvoice(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Verify invoice exists and is a proforma invoice
    const invoiceData = await db
      .select({
        id: invoice.id,
        invoiceType: invoice.invoiceType,
        invoiceNumber: invoice.invoiceNumber,
      })
      .from(invoice)
      .where(eq(invoice.id, input.id))
      .limit(1);

    if (invoiceData.length === 0) {
      return {
        data: null,
        error: "Facture proforma non trouvée",
      };
    }

    if (invoiceData[0].invoiceType !== "proforma") {
      return {
        data: null,
        error: "Cette facture n'est pas une facture proforma",
      };
    }

    await db.transaction(async (tx) => {
      // Delete all payments associated with this invoice
      const invoicePayments = await tx
        .select({ id: payment.id })
        .from(payment)
        .where(eq(payment.invoiceId, input.id));

      if (invoicePayments.length > 0) {
        await tx.delete(payment).where(eq(payment.invoiceId, input.id));
      }

      // Delete all invoice items
      await tx.delete(invoiceItem).where(eq(invoiceItem.invoiceId, input.id));

      // Delete the invoice
      await tx.delete(invoice).where(eq(invoice.id, input.id));
    });

    updateTag("invoices");
    updateTag("payments");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting proforma invoice", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete multiple proforma invoices
 */
export async function deleteProformaInvoices(input: { ids: string[] }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    if (input.ids.length === 0) {
      return {
        data: null,
        error: "Aucune facture sélectionnée",
      };
    }

    // Verify all invoices exist and are proforma invoices
    const invoicesData = await db
      .select({
        id: invoice.id,
        invoiceType: invoice.invoiceType,
      })
      .from(invoice)
      .where(inArray(invoice.id, input.ids));

    if (invoicesData.length === 0) {
      return {
        data: null,
        error: "Aucune facture proforma trouvée",
      };
    }

    // Verify all are proforma invoices
    const nonProformaInvoices = invoicesData.filter(
      (inv) => inv.invoiceType !== "proforma"
    );

    if (nonProformaInvoices.length > 0) {
      return {
        data: null,
        error: "Certaines factures ne sont pas des factures proforma",
      };
    }

    await db.transaction(async (tx) => {
      // Delete all payments associated with these invoices
      if (input.ids.length > 0) {
        await tx.delete(payment).where(inArray(payment.invoiceId, input.ids));
      }

      // Delete all invoice items
      if (input.ids.length > 0) {
        await tx.delete(invoiceItem).where(inArray(invoiceItem.invoiceId, input.ids));
      }

      // Delete the invoices
      if (input.ids.length > 0) {
        await tx.delete(invoice).where(inArray(invoice.id, input.ids));
      }
    });

    updateTag("invoices");
    updateTag("payments");

    return {
      data: { ids: input.ids },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting proforma invoices", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all clients for the proforma invoice form
 */
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

/**
 * Get proforma invoice by ID
 */
export async function getProformaInvoiceById(input: { id: string }) {
  try {
    const result = await getInvoiceById(input);
    
    if (!result.data) {
      return {
        data: null,
        error: result.error || "Facture proforma non trouvée",
      };
    }

    // Verify it's a proforma invoice
    if (result.data.invoiceType !== "proforma") {
      return {
        data: null,
        error: "Cette facture n'est pas une facture proforma",
      };
    }

    return result;
  } catch (err) {
    console.error("Error getting proforma invoice by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Update a proforma invoice
 */
export async function updateProformaInvoice(input: {
  id: string;
  invoiceNumber: string;
  clientId: string;
  invoiceDate: Date;
  dueDate?: Date;
  destinationCountry?: string;
  deliveryLocation?: string;
  currency?: string;
  notes?: string;
  items: Array<{
    id?: string;
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

    // Verify invoice exists and is a proforma invoice
    const invoiceData = await db
      .select({
        id: invoice.id,
        invoiceType: invoice.invoiceType,
      })
      .from(invoice)
      .where(eq(invoice.id, input.id))
      .limit(1);

    if (invoiceData.length === 0) {
      return {
        data: null,
        error: "Facture proforma non trouvée",
      };
    }

    if (invoiceData[0].invoiceType !== "proforma") {
      return {
        data: null,
        error: "Cette facture n'est pas une facture proforma",
      };
    }

    // Format dates
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const invoiceDateValue = formatDateLocal(input.invoiceDate);
    const dueDateValue = input.dueDate ? formatDateLocal(input.dueDate) : null;

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const taxAmount = input.items.reduce((sum, item) => sum + item.lineTax, 0);
    const totalAmount = input.items.reduce((sum, item) => sum + item.lineTotal, 0);

    await db.transaction(async (tx) => {
      // Update invoice
      await tx
        .update(invoice)
        .set({
          invoiceNumber: input.invoiceNumber,
          clientId: input.clientId,
          invoiceDate: invoiceDateValue,
          dueDate: dueDateValue,
          currency: input.currency || "USD",
          destinationCountry: input.destinationCountry || null,
          deliveryLocation: input.deliveryLocation || null,
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          notes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(invoice.id, input.id));

      // Delete existing invoice items
      await tx.delete(invoiceItem).where(eq(invoiceItem.invoiceId, input.id));

      // Insert new invoice items
      const itemsToInsert = input.items.map((item) => ({
        id: item.id || generateId(),
        invoiceId: input.id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: (item.discountPercent || 0).toString(),
        taxRate: (item.taxRate || 0).toString(),
        lineSubtotal: item.lineSubtotal.toString(),
        lineTax: item.lineTax.toString(),
        lineTotal: item.lineTotal.toString(),
      }));

      if (itemsToInsert.length > 0) {
        await tx.insert(invoiceItem).values(itemsToInsert);
      }
    });

    updateTag("invoices");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating proforma invoice", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

