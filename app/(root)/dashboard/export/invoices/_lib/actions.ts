"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import db from "@/db";
import { invoice, invoiceItem, payment, partner } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";

/**
 * Delete an export invoice
 * This deletes associated payments, invoice items, and the invoice itself
 */
export async function deleteExportInvoice(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Verify invoice exists and is an export invoice
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
        error: "Facture export non trouvée",
      };
    }

    if (invoiceData[0].invoiceType !== "sale_export") {
      return {
        data: null,
        error: "Cette facture n'est pas une facture export",
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
    console.error("Error deleting export invoice", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete multiple export invoices
 */
export async function deleteExportInvoices(input: { ids: string[] }) {
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

    // Verify all invoices exist and are export invoices
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
        error: "Aucune facture export trouvée",
      };
    }

    // Verify all are export invoices
    const nonExportInvoices = invoicesData.filter(
      (inv) => inv.invoiceType !== "sale_export"
    );

    if (nonExportInvoices.length > 0) {
      return {
        data: null,
        error: "Certaines factures ne sont pas des factures export",
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
    console.error("Error deleting export invoices", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all clients for the export invoice form
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

