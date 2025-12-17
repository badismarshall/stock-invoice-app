import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import db from "@/db";
import { invoice, partner, user } from "@/db/schema";
import { z } from "zod";
import type { InvoiceDTO } from "./invoice.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

// Schema for invoice queries
const invoiceTypes = ["sale_local", "sale_export", "proforma", "purchase", "sale_invoice", "delivery_note_invoice"] as const;
const paymentStatuses = ["unpaid", "partially_paid", "paid"] as const;
const statuses = ["active", "cancelled"] as const;

export const GetInvoicesSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  sort: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  filters: z.array(z.object({ id: z.string(), value: z.union([z.string(), z.array(z.string())]) })).default([]),
  filterFlag: z.enum(["advancedFilters", "commandFilters"]).optional(),
  joinOperator: z.enum(["and", "or"]).default("and"),
  invoiceNumber: z.string().default(""),
  invoiceType: z.array(z.enum(invoiceTypes)).default([]),
  paymentStatus: z.array(z.enum(paymentStatuses)).default([]),
  status: z.array(z.enum(statuses)).default([]),
  clientId: z.array(z.string()).default([]),
  supplierId: z.array(z.string()).default([]),
  invoiceDate: z.array(z.date()).default([]),
  dueDate: z.array(z.date()).default([]),
  createdAt: z.array(z.date()).default([]),
});

export const getInvoices = async (input: z.infer<typeof GetInvoicesSchema>): Promise<InvoiceDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: invoice,
      filters: input.filters as any,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Exclude delivery_note_invoice from main invoices table (unless explicitly requested)
          input.invoiceType && input.invoiceType.length > 0 && input.invoiceType.includes("delivery_note_invoice")
            ? undefined
            : sql`${invoice.invoiceType} != 'delivery_note_invoice'`,
          // Search by invoice number
          input.invoiceNumber
            ? ilike(invoice.invoiceNumber, `%${input.invoiceNumber}%`)
            : undefined,
          // Filter by invoice type
          input.invoiceType && input.invoiceType.length > 0
            ? inArray(invoice.invoiceType, input.invoiceType)
            : undefined,
          // Filter by payment status
          input.paymentStatus && input.paymentStatus.length > 0
            ? inArray(
                invoice.paymentStatus,
                input.paymentStatus as ("unpaid" | "partially_paid" | "paid")[]
              )
            : undefined,
          // Filter by status
          input.status && input.status.length > 0
            ? inArray(invoice.status, input.status as ("active" | "cancelled")[])
            : undefined,
          // Filter by client
          input.clientId && input.clientId.length > 0
            ? inArray(invoice.clientId, input.clientId)
            : undefined,
          // Filter by supplier
          input.supplierId && input.supplierId.length > 0
            ? inArray(invoice.supplierId, input.supplierId)
            : undefined,
          // Filter by invoiceDate date range
          input.invoiceDate && input.invoiceDate.length > 0
            ? and(
                input.invoiceDate[0]
                  ? gte(
                      invoice.invoiceDate,
                      (() => {
                        const date = new Date(input.invoiceDate[0]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
                input.invoiceDate[1]
                  ? lte(
                      invoice.invoiceDate,
                      (() => {
                        const date = new Date(input.invoiceDate[1]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
          // Filter by dueDate date range
          input.dueDate && input.dueDate.length > 0
            ? and(
                input.dueDate[0]
                  ? gte(
                      invoice.dueDate,
                      (() => {
                        const date = new Date(input.dueDate[0]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
                input.dueDate[1]
                  ? lte(
                      invoice.dueDate,
                      (() => {
                        const date = new Date(input.dueDate[1]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt && input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      invoice.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      invoice.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[1]);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
        ) || undefined;

    // Map sort IDs to actual columns
    const columnMap = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      totalAmount: invoice.totalAmount,
      paymentStatus: invoice.paymentStatus,
      status: invoice.status,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    } as const;

    const orderBy =
      input.sort && input.sort.length > 0
        ? input.sort
            .map((item) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(invoice.createdAt)];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const { data, total, summary } = await db.transaction(async (tx) => {
      // First get invoices with client info
      const invoicesWithClient = await tx
        .select({
          invoice: invoice,
          client: {
            id: partner.id,
            name: partner.name,
          },
          creator: {
            id: user.id,
            name: user.name,
          },
        })
        .from(invoice)
        .leftJoin(partner, eq(invoice.clientId, partner.id))
        .leftJoin(user, eq(invoice.createdBy, user.id))
        .where(where || undefined)
        .limit(input.perPage)
        .offset(offset)
        .orderBy(...orderBy);

      // Then get supplier info for invoices that have suppliers
      const invoiceIds = invoicesWithClient
        .map((item) => item.invoice.supplierId)
        .filter((id): id is string => id !== null);
      
      const suppliers = invoiceIds.length > 0
        ? await tx
            .select({
              id: partner.id,
              name: partner.name,
            })
            .from(partner)
            .where(inArray(partner.id, invoiceIds))
        : [];

      const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

      // Combine the data
      const data = invoicesWithClient.map((item) => ({
        invoice: item.invoice,
        client: item.client,
        supplier: item.invoice.supplierId
          ? {
              id: item.invoice.supplierId,
              name: supplierMap.get(item.invoice.supplierId) || null,
            }
          : null,
        creator: item.creator,
      }));

      const total = await tx
        .select({
          count: count(),
        })
        .from(invoice)
        .where(where || undefined)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      // Calculate summary statistics
      const summaryData = await tx
        .select({
          totalInvoices: count(),
          totalAmount: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS NUMERIC)), 0)`,
          paidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'paid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
          unpaidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'unpaid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
          partiallyPaidAmount: sql<string>`COALESCE(SUM(CASE WHEN ${invoice.paymentStatus} = 'partially_paid' THEN CAST(${invoice.totalAmount} AS NUMERIC) ELSE 0 END), 0)`,
          unpaidCount: sql<string>`COUNT(CASE WHEN ${invoice.paymentStatus} = 'unpaid' THEN 1 END)`,
          partiallyPaidCount: sql<string>`COUNT(CASE WHEN ${invoice.paymentStatus} = 'partially_paid' THEN 1 END)`,
          paidCount: sql<string>`COUNT(CASE WHEN ${invoice.paymentStatus} = 'paid' THEN 1 END)`,
          overdueCount: sql<string>`COUNT(CASE WHEN ${invoice.dueDate} IS NOT NULL AND ${invoice.dueDate}::date < ${sql.raw(`'${todayStr}'`)}::date AND ${invoice.paymentStatus}::text != 'paid' THEN 1 END)`,
        })
        .from(invoice)
        .where(where || undefined)
        .execute()
        .then((res) => res[0] ?? {
          totalInvoices: 0,
          totalAmount: "0",
          paidAmount: "0",
          unpaidAmount: "0",
          partiallyPaidAmount: "0",
          unpaidCount: "0",
          partiallyPaidCount: "0",
          paidCount: "0",
          overdueCount: "0",
        });

      return {
        data,
        total,
        summary: summaryData,
      };
    });

    return {
      invoices: data.map((item) => {
        const invoiceDate = typeof item.invoice.invoiceDate === 'string'
          ? new Date(item.invoice.invoiceDate + 'T00:00:00')
          : item.invoice.invoiceDate;
        const dueDate = item.invoice.dueDate
          ? (typeof item.invoice.dueDate === 'string'
              ? new Date(item.invoice.dueDate + 'T00:00:00')
              : item.invoice.dueDate)
          : null;

        // Check if overdue
        const isOverdue = dueDate ? (dueDate < today && item.invoice.paymentStatus !== 'paid') : undefined;

        return {
          id: item.invoice.id,
          invoiceNumber: item.invoice.invoiceNumber,
          invoiceType: item.invoice.invoiceType,
          clientId: item.invoice.clientId,
          clientName: item.client?.name || null,
          supplierId: item.invoice.supplierId,
          supplierName: item.supplier?.name || null,
          deliveryNoteId: item.invoice.deliveryNoteId,
          invoiceDate,
          dueDate,
          currency: item.invoice.currency,
          destinationCountry: item.invoice.destinationCountry,
          deliveryLocation: item.invoice.deliveryLocation,
          subtotal: parseFloat(item.invoice.subtotal || "0"),
          taxAmount: parseFloat(item.invoice.taxAmount || "0"),
          totalAmount: parseFloat(item.invoice.totalAmount || "0"),
          paymentStatus: item.invoice.paymentStatus || "unpaid",
          status: item.invoice.status || "active",
          paymentMethod: item.invoice.paymentMethod,
          notes: item.invoice.notes,
          createdBy: item.invoice.createdBy,
          createdByName: item.creator?.name || null,
          createdAt: item.invoice.createdAt,
          updatedAt: item.invoice.updatedAt,
          isOverdue,
        };
      }),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
      summary: {
        totalInvoices: summary.totalInvoices,
        totalAmount: parseFloat(summary.totalAmount.toString()),
        paidAmount: parseFloat(summary.paidAmount.toString()),
        unpaidAmount: parseFloat(summary.unpaidAmount.toString()),
        partiallyPaidAmount: parseFloat(summary.partiallyPaidAmount.toString()),
        unpaidCount: parseFloat(summary.unpaidCount.toString()),
        partiallyPaidCount: parseFloat(summary.partiallyPaidCount.toString()),
        paidCount: parseFloat(summary.paidCount.toString()),
        overdueCount: parseFloat(summary.overdueCount.toString()),
      },
    };
  } catch (error) {
    console.error("Error getting invoices", error);
    return {
      invoices: [],
      options: { totalCount: 0, limit: input.perPage, offset: (input.page - 1) * input.perPage },
      summary: {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        partiallyPaidAmount: 0,
        unpaidCount: 0,
        partiallyPaidCount: 0,
        paidCount: 0,
        overdueCount: 0,
      },
    };
  }
};

