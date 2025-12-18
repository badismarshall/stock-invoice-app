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
import { payment, invoice, partner, user } from "@/db/schema";
import { z } from "zod";
import type { PaymentDTO } from "./payment.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

// Schema for payment queries
const paymentMethods = ["cash", "check", "transfer", "other"] as const;

export const GetPaymentsSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  sort: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  filters: z.array(z.object({ id: z.string(), value: z.union([z.string(), z.array(z.string())]) })).default([]),
  filterFlag: z.enum(["advancedFilters", "commandFilters"]).optional(),
  joinOperator: z.enum(["and", "or"]).default("and"),
  paymentNumber: z.string().default(""),
  invoiceId: z.array(z.string()).default([]),
  clientId: z.array(z.string()).default([]),
  supplierId: z.array(z.string()).default([]),
  paymentMethod: z.array(z.enum(paymentMethods)).default([]),
  paymentDate: z.array(z.date()).default([]),
  createdAt: z.array(z.date()).default([]),
});

export const getPayments = async (input: z.infer<typeof GetPaymentsSchema>): Promise<PaymentDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: payment,
      filters: input.filters as any,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by payment number
          input.paymentNumber
            ? ilike(payment.paymentNumber, `%${input.paymentNumber}%`)
            : undefined,
          // Filter by invoice
          input.invoiceId && input.invoiceId.length > 0
            ? inArray(payment.invoiceId, input.invoiceId)
            : undefined,
          // Filter by client
          input.clientId && input.clientId.length > 0
            ? inArray(payment.clientId, input.clientId)
            : undefined,
          // Filter by supplier
          input.supplierId && input.supplierId.length > 0
            ? inArray(payment.supplierId, input.supplierId)
            : undefined,
          // Filter by payment method
          input.paymentMethod && input.paymentMethod.length > 0
            ? inArray(payment.paymentMethod, input.paymentMethod as ("cash" | "check" | "transfer" | "other")[])
            : undefined,
          // Filter by paymentDate date range
          input.paymentDate && input.paymentDate.length > 0
            ? and(
                input.paymentDate[0]
                  ? gte(
                      payment.paymentDate,
                      (() => {
                        const date = new Date(input.paymentDate[0]);
                        date.setHours(0, 0, 0, 0);
                        return date.toISOString().split('T')[0];
                      })()
                    )
                  : undefined,
                input.paymentDate[1]
                  ? lte(
                      payment.paymentDate,
                      (() => {
                        const date = new Date(input.paymentDate[1]);
                        date.setHours(23, 59, 59, 999);
                        return date.toISOString().split('T')[0];
                      })()
                    )
                  : undefined,
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt && input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(payment.createdAt, input.createdAt[0])
                  : undefined,
                input.createdAt[1]
                  ? lte(payment.createdAt, input.createdAt[1])
                  : undefined,
              )
            : undefined,
        );

    // Build order by
    const orderBy =
      input.sort && input.sort.length > 0
        ? input.sort.map((sort) => {
            switch (sort.id) {
              case "paymentNumber":
                return sort.desc ? desc(payment.paymentNumber) : asc(payment.paymentNumber);
              case "paymentDate":
                return sort.desc ? desc(payment.paymentDate) : asc(payment.paymentDate);
              case "amount":
                return sort.desc ? desc(payment.amount) : asc(payment.amount);
              case "paymentMethod":
                return sort.desc ? desc(payment.paymentMethod) : asc(payment.paymentMethod);
              case "createdAt":
                return sort.desc ? desc(payment.createdAt) : asc(payment.createdAt);
              default:
                return desc(payment.createdAt);
            }
          }).filter((item) => item !== null)
        : [desc(payment.paymentDate), desc(payment.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      // Get payments with invoice and user info
      const paymentsData = await tx
        .select({
          payment: payment,
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            invoiceType: invoice.invoiceType,
            clientId: invoice.clientId,
            supplierId: invoice.supplierId,
          },
          creator: {
            id: user.id,
            name: user.name,
          },
        })
        .from(payment)
        .leftJoin(invoice, eq(payment.invoiceId, invoice.id))
        .leftJoin(user, eq(payment.createdBy, user.id))
        .where(where || undefined)
        .limit(input.perPage)
        .offset(offset)
        .orderBy(...orderBy);

      // Get client and supplier info separately
      const clientIds = paymentsData
        .map((item) => item.payment.clientId)
        .filter((id): id is string => id !== null);
      
      const supplierIds = paymentsData
        .map((item) => item.payment.supplierId)
        .filter((id): id is string => id !== null);

      const allPartnerIds = [...new Set([...clientIds, ...supplierIds])];
      
      const partners = allPartnerIds.length > 0
        ? await tx
            .select({
              id: partner.id,
              name: partner.name,
            })
            .from(partner)
            .where(inArray(partner.id, allPartnerIds))
        : [];

      const partnerMap = new Map(partners.map((p) => [p.id, p.name]));

      const total = await tx
        .select({
          count: count(),
        })
        .from(payment)
        .where(where || undefined)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data: paymentsData.map((item) => ({
          id: item.payment.id,
          paymentNumber: item.payment.paymentNumber,
          invoiceId: item.payment.invoiceId,
          invoiceNumber: item.invoice?.invoiceNumber || null,
          invoiceType: item.invoice?.invoiceType || null,
          clientId: item.payment.clientId,
          clientName: item.payment.clientId ? partnerMap.get(item.payment.clientId) || null : null,
          supplierId: item.payment.supplierId,
          supplierName: item.payment.supplierId ? partnerMap.get(item.payment.supplierId) || null : null,
          paymentDate: typeof item.payment.paymentDate === "string"
            ? new Date(item.payment.paymentDate + "T00:00:00")
            : item.payment.paymentDate,
          amount: parseFloat(item.payment.amount),
          paymentMethod: item.payment.paymentMethod,
          reference: item.payment.reference,
          notes: item.payment.notes,
          createdBy: item.payment.createdBy,
          createdByName: item.creator?.name || null,
          createdAt: item.payment.createdAt,
        })),
        total,
      };
    });

    return {
      payments: data,
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting payments", error);
    return {
      payments: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: (input.page - 1) * input.perPage,
      },
    };
  }
};

/**
 * Get a payment by ID with all relations
 */
export const getPaymentById = async (id: string) => {
  try {
    const result = await db
      .select({
        payment: payment,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          totalAmount: invoice.totalAmount,
          clientId: invoice.clientId,
          supplierId: invoice.supplierId,
        },
        client: {
          id: partner.id,
          name: partner.name,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(payment)
      .leftJoin(invoice, eq(payment.invoiceId, invoice.id))
      .leftJoin(user, eq(payment.createdBy, user.id))
      .where(eq(payment.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    
    // Get client and supplier info if they exist
    const clientInfo = item.payment.clientId
      ? await db
          .select({
            id: partner.id,
            name: partner.name,
          })
          .from(partner)
          .where(eq(partner.id, item.payment.clientId))
          .limit(1)
      : [];
    
    const supplierInfo = item.payment.supplierId
      ? await db
          .select({
            id: partner.id,
            name: partner.name,
          })
          .from(partner)
          .where(eq(partner.id, item.payment.supplierId))
          .limit(1)
      : [];
    
    return {
      id: item.payment.id,
      paymentNumber: item.payment.paymentNumber,
      invoiceId: item.payment.invoiceId,
      invoice: item.invoice
        ? {
            id: item.invoice.id,
            invoiceNumber: item.invoice.invoiceNumber,
            invoiceType: item.invoice.invoiceType,
            totalAmount: parseFloat(item.invoice.totalAmount),
            clientId: item.invoice.clientId,
            supplierId: item.invoice.supplierId,
          }
        : null,
      clientId: item.payment.clientId,
      client: clientInfo.length > 0
        ? {
            id: clientInfo[0].id,
            name: clientInfo[0].name,
          }
        : null,
      supplierId: item.payment.supplierId,
      supplier: supplierInfo.length > 0
        ? {
            id: supplierInfo[0].id,
            name: supplierInfo[0].name,
          }
        : null,
      paymentDate: typeof item.payment.paymentDate === "string"
        ? new Date(item.payment.paymentDate + "T00:00:00")
        : item.payment.paymentDate,
      amount: parseFloat(item.payment.amount),
      paymentMethod: item.payment.paymentMethod,
      reference: item.payment.reference,
      notes: item.payment.notes,
      createdBy: item.payment.createdBy,
      createdByName: item.creator?.name || null,
      createdAt: item.payment.createdAt,
    };
  } catch (error) {
    console.error("Error getting payment by ID", error);
    return null;
  }
};

/**
 * Get all payments for a specific invoice
 */
export const getPaymentsByInvoiceId = async (invoiceId: string) => {
  try {
    const result = await db
      .select({
        payment: payment,
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(payment)
      .leftJoin(user, eq(payment.createdBy, user.id))
      .where(eq(payment.invoiceId, invoiceId))
      .orderBy(desc(payment.paymentDate), desc(payment.createdAt));

    return result.map((item) => ({
      id: item.payment.id,
      paymentNumber: item.payment.paymentNumber,
      invoiceId: item.payment.invoiceId,
      clientId: item.payment.clientId,
      supplierId: item.payment.supplierId,
      paymentDate: typeof item.payment.paymentDate === "string"
        ? new Date(item.payment.paymentDate + "T00:00:00")
        : item.payment.paymentDate,
      amount: parseFloat(item.payment.amount),
      paymentMethod: item.payment.paymentMethod,
      reference: item.payment.reference,
      notes: item.payment.notes,
      createdBy: item.payment.createdBy,
      createdByName: item.creator?.name || null,
      createdAt: item.payment.createdAt,
    }));
  } catch (error) {
    console.error("Error getting payments by invoice ID", error);
    return [];
  }
};

/**
 * Calculate total paid amount for an invoice
 */
export const getTotalPaidForInvoice = async (invoiceId: string): Promise<number> => {
  try {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payment.amount}::numeric), 0)`,
      })
      .from(payment)
      .where(eq(payment.invoiceId, invoiceId))
      .execute();

    return parseFloat(result[0]?.total?.toString() || "0");
  } catch (error) {
    console.error("Error calculating total paid for invoice", error);
    return 0;
  }
};

