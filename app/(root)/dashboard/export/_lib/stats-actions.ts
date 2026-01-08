"use server";

import db from "@/db";
import { 
  deliveryNote, 
  deliveryNoteItem, 
  invoice,
  invoiceItem,
  partner,
  product,
  payment,
} from "@/db/schema";
import { eq, and, or, gte, lte, sql, desc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/handle-error";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subDays } from "date-fns";

export interface ExportSalesStats {
  summary: {
    totalDeliveryNotes: number;
    totalInvoices: number;
    totalProformaInvoices: number;
    totalAmountHT: number;
    totalTaxAmount: number;
    totalAmountTTC: number;
    paidAmount: number;
    unpaidAmount: number;
    partiallyPaidAmount: number;
    growth: number;
  };
  byClient: Array<{
    clientId: string;
    clientName: string;
    transactionCount: number;
    totalAmount: number;
  }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    productCode: string;
    totalQuantity: number;
    totalAmount: number;
  }>;
  byPeriod: Array<{
    period: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  byCurrency: Array<{
    currency: string;
    totalAmount: number;
    transactionCount: number;
  }>;
}

/**
 * Get comprehensive statistics for export sales
 */
export async function getExportSalesStats(input?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{ data: ExportSalesStats | null; error: string | null }> {
  try {
    const startDate = input?.startDate || startOfYear(new Date());
    const endDate = input?.endDate || new Date();
    
    // Format dates for SQL
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // Get previous period for growth calculation
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = subDays(startDate, periodDays);
    const prevEndDate = subDays(endDate, periodDays);
    const prevStartDateStr = formatDate(prevStartDate);
    const prevEndDateStr = formatDate(prevEndDate);

    // Summary statistics - Delivery Notes
    const deliveryNotesStats = await db
      .select({
        totalCount: sql<string>`COUNT(*)`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${deliveryNoteItem.lineTotal} AS NUMERIC)), 0)`,
      })
      .from(deliveryNote)
      .innerJoin(deliveryNoteItem, eq(deliveryNote.id, deliveryNoteItem.deliveryNoteId))
      .where(
        and(
          eq(deliveryNote.noteType, "export"),
          eq(deliveryNote.status, "active"),
          gte(deliveryNote.noteDate, startDateStr),
          lte(deliveryNote.noteDate, endDateStr)
        )
      )
      .then((res) => res[0] || { totalCount: "0", totalAmount: "0" });

    // Summary statistics - Invoices (sale_export)
    const invoicesStats = await db
      .select({
        totalCount: sql<string>`COUNT(*)`,
        totalAmountHT: sql<string>`COALESCE(SUM(CAST(${invoice.subtotal} AS NUMERIC)), 0)`,
        totalTaxAmount: sql<string>`COALESCE(SUM(CAST(${invoice.taxAmount} AS NUMERIC)), 0)`,
        totalAmountTTC: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
        paidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'paid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
        unpaidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'unpaid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
        partiallyPaidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'partially_paid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.invoiceType, "sale_export"),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startDateStr),
          lte(invoice.invoiceDate, endDateStr)
        )
      )
      .then((res) => res[0] || {
        totalCount: "0",
        totalAmountHT: "0",
        totalTaxAmount: "0",
        totalAmountTTC: "0",
        paidAmount: "0",
        unpaidAmount: "0",
        partiallyPaidAmount: "0",
      });

    // Proforma invoices count
    const proformaStats = await db
      .select({
        totalCount: sql<string>`COUNT(*)`,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.invoiceType, "proforma"),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startDateStr),
          lte(invoice.invoiceDate, endDateStr)
        )
      )
      .then((res) => res[0] || { totalCount: "0" });

    // Previous period for growth
    const prevInvoicesStats = await db
      .select({
        totalAmountTTC: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          or(
            eq(invoice.invoiceType, "sale_export"),
            eq(invoice.invoiceType, "proforma")
          ),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, prevStartDateStr),
          lte(invoice.invoiceDate, prevEndDateStr)
        )
      )
      .then((res) => res[0] || { totalAmountTTC: "0" });

    // Calculate growth
    const currentTotal = parseFloat(invoicesStats.totalAmountTTC);
    const previousTotal = parseFloat(prevInvoicesStats.totalAmountTTC);
    const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    // Statistics by Client
    const byClient = await db
      .select({
        clientId: partner.id,
        clientName: partner.name,
        transactionCount: sql<string>`COUNT(DISTINCT ${invoice.id})`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(invoice)
      .innerJoin(partner, eq(invoice.clientId, partner.id))
      .where(
        and(
          or(
            eq(invoice.invoiceType, "sale_export"),
            eq(invoice.invoiceType, "proforma")
          ),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startDateStr),
          lte(invoice.invoiceDate, endDateStr)
        )
      )
      .groupBy(partner.id, partner.name)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`))
      .limit(10);

    // Statistics by Product (from delivery notes)
    const byProduct = await db
      .select({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        totalQuantity: sql<string>`COALESCE(SUM(CAST(${deliveryNoteItem.quantity} AS NUMERIC)), 0)`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${deliveryNoteItem.lineTotal} AS NUMERIC)), 0)`,
      })
      .from(deliveryNoteItem)
      .innerJoin(deliveryNote, eq(deliveryNoteItem.deliveryNoteId, deliveryNote.id))
      .innerJoin(product, eq(deliveryNoteItem.productId, product.id))
      .where(
        and(
          eq(deliveryNote.noteType, "export"),
          eq(deliveryNote.status, "active"),
          gte(deliveryNote.noteDate, startDateStr),
          lte(deliveryNote.noteDate, endDateStr)
        )
      )
      .groupBy(product.id, product.name, product.code)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${deliveryNoteItem.lineTotal} AS NUMERIC)), 0)`))
      .limit(10);

    // Statistics by Period (monthly)
    const byPeriod = await db
      .select({
        period: sql<string>`TO_CHAR(${invoice.invoiceDate}, 'YYYY-MM')`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
        transactionCount: sql<string>`COUNT(*)`,
      })
      .from(invoice)
      .where(
        and(
          or(
            eq(invoice.invoiceType, "sale_export"),
            eq(invoice.invoiceType, "proforma")
          ),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startDateStr),
          lte(invoice.invoiceDate, endDateStr)
        )
      )
      .groupBy(sql`TO_CHAR(${invoice.invoiceDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoice.invoiceDate}, 'YYYY-MM')`);

    // Statistics by Currency
    const byCurrency = await db
      .select({
        currency: sql<string>`COALESCE(${invoice.currency}, 'DZD')`,
        totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
        transactionCount: sql<string>`COUNT(*)`,
      })
      .from(invoice)
      .where(
        and(
          or(
            eq(invoice.invoiceType, "sale_export"),
            eq(invoice.invoiceType, "proforma")
          ),
          eq(invoice.status, "active"),
          gte(invoice.invoiceDate, startDateStr),
          lte(invoice.invoiceDate, endDateStr)
        )
      )
      .groupBy(invoice.currency)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`));

    return {
      data: {
        summary: {
          totalDeliveryNotes: parseInt(deliveryNotesStats.totalCount),
          totalInvoices: parseInt(invoicesStats.totalCount),
          totalProformaInvoices: parseInt(proformaStats.totalCount),
          totalAmountHT: parseFloat(invoicesStats.totalAmountHT),
          totalTaxAmount: parseFloat(invoicesStats.totalTaxAmount),
          totalAmountTTC: parseFloat(invoicesStats.totalAmountTTC),
          paidAmount: parseFloat(invoicesStats.paidAmount),
          unpaidAmount: parseFloat(invoicesStats.unpaidAmount),
          partiallyPaidAmount: parseFloat(invoicesStats.partiallyPaidAmount),
          growth: growth,
        },
        byClient: byClient.map((c) => ({
          clientId: c.clientId,
          clientName: c.clientName || "Client inconnu",
          transactionCount: parseInt(c.transactionCount),
          totalAmount: parseFloat(c.totalAmount),
        })),
        byProduct: byProduct.map((p) => ({
          productId: p.productId,
          productName: p.productName || "Produit inconnu",
          productCode: p.productCode || "",
          totalQuantity: parseFloat(p.totalQuantity),
          totalAmount: parseFloat(p.totalAmount),
        })),
        byPeriod: byPeriod.map((p) => ({
          period: p.period,
          totalAmount: parseFloat(p.totalAmount),
          transactionCount: parseInt(p.transactionCount),
        })),
        byCurrency: byCurrency.map((c) => ({
          currency: c.currency || "DZD",
          totalAmount: parseFloat(c.totalAmount),
          transactionCount: parseInt(c.transactionCount),
        })),
      },
      error: null,
    };
  } catch (err) {
    console.error("Error getting export sales stats:", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

