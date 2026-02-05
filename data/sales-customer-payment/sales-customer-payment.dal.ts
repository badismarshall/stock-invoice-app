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
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import db from "@/db";
import { invoice, payment, partner, invoiceCancellation } from "@/db/schema";

const SALE_LOCAL_ONLY = "sale_local" as const;
import type { SalesCustomerPaymentDTO } from "./sales-customer-payment.dto";

type GetSalesCustomerPaymentsSchema = {
  page: number;
  perPage: number;
  sort: Array<{ id: string; desc: boolean }>;
  filters?: any;
  filterFlag?: "filters" | "advancedFilters" | "commandFilters";
  joinOperator?: "and" | "or";
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
  clientId?: string[]; // Array of client IDs
  paymentMethod?: string[]; // Array of payment methods
  // Basic toolbar filters
  date?: number[]; // Array of timestamps for date range
  invoiceNumber?: string; // Invoice number filter from toolbar
};

export const getSalesCustomerPayments = async (
  input: GetSalesCustomerPaymentsSchema
): Promise<SalesCustomerPaymentDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    // Custom filter handling with column mapping (same approach as delivery-note.dal.ts)
    const advancedWhere = input.filters && input.filters.length > 0
      ? (() => {
        const joinFn = input.joinOperator === "and" ? and : or;
        const conditions = input.filters.map((filter: any) => {
          if (!filter.operator) return undefined;

          // Map column IDs from table to actual database columns
          let column: any;
          switch (filter.id) {
            case "date":
              column = payment.paymentDate;
              break;
            case "clientId":
              column = payment.clientId;
              break;
            case "paymentMethod":
              column = payment.paymentMethod;
              break;
            case "invoiceNumber":
              column = invoice.invoiceNumber;
              break;
            default:
              return undefined;
          }

          // Handle date columns (paymentDate is a date type, not timestamp)
          const isDateType = filter.id === "date";

          switch (filter.operator) {
            case "iLike":
              return filter.variant === "text" && typeof filter.value === "string"
                ? ilike(column, `%${filter.value}%`)
                : undefined;

            case "notILike":
              return filter.variant === "text" && typeof filter.value === "string"
                ? sql`NOT (${column}::text ILIKE ${`%${filter.value}%`})`
                : undefined;

            case "eq":
              if (column.dataType === "boolean" && typeof filter.value === "string") {
                return eq(column, filter.value === "true");
              }
              if (filter.variant === "date" || filter.variant === "dateRange") {
                if (isDateType) {
                  // For date columns, use string format YYYY-MM-DD
                  const date = new Date(Number(filter.value));
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  return eq(column, dateStr);
                }
              }
              return eq(column, filter.value);

            case "isBetween":
              if (
                (filter.variant === "date" || filter.variant === "dateRange") &&
                Array.isArray(filter.value) &&
                filter.value.length === 2
              ) {
                if (isDateType) {
                  // For date columns, use string format YYYY-MM-DD
                  const startDate = filter.value[0]
                    ? (() => {
                        const date = new Date(Number(filter.value[0]));
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    : null;
                  const endDate = filter.value[1]
                    ? (() => {
                        const date = new Date(Number(filter.value[1]));
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    : null;
                  return and(
                    startDate ? gte(column, startDate) : undefined,
                    endDate ? lte(column, endDate) : undefined,
                  );
                }
              }
              return undefined;

            case "inArray":
              if (Array.isArray(filter.value)) {
                return inArray(column, filter.value);
              }
              return undefined;

            case "notInArray":
              if (Array.isArray(filter.value)) {
                return notInArray(column, filter.value);
              }
              return undefined;

            case "isEmpty":
              return sql`${column} IS NULL`;

            case "isNotEmpty":
              return sql`${column} IS NOT NULL`;

            default:
              return undefined;
          }
        });

        const validConditions = conditions.filter((c: any) => c !== undefined);
        return validConditions.length > 0 ? joinFn(...validConditions) : undefined;
      })()
      : undefined;

    // Build where clause: sale_local only (export handled in /export/...)
    const where = advancedTable
      ? and(
          advancedWhere || undefined,
          eq(invoice.invoiceType, SALE_LOCAL_ONLY),
          sql`${payment.clientId} IS NOT NULL`,
        )
      : and(
          input.invoiceNumber
            ? ilike(invoice.invoiceNumber, `%${input.invoiceNumber}%`)
            : undefined,
          input.date && input.date.length > 0
            ? and(
                input.date[0]
                  ? gte(
                      payment.paymentDate,
                      (() => {
                        const timestamp = input.date[0];
                        const date = new Date(timestamp);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    )
                  : undefined,
                input.date[1]
                  ? lte(
                      payment.paymentDate,
                      (() => {
                        const timestamp = input.date[1];
                        const date = new Date(timestamp);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    )
                  : undefined,
              )
            : undefined,
          input.startDate || input.endDate
            ? and(
                input.startDate ? gte(payment.paymentDate, input.startDate) : undefined,
                input.endDate ? lte(payment.paymentDate, input.endDate) : undefined
              )
            : undefined,
          input.clientId && input.clientId.length > 0
            ? inArray(payment.clientId, input.clientId)
            : undefined,
          input.paymentMethod && input.paymentMethod.length > 0
            ? inArray(payment.paymentMethod, input.paymentMethod as any[])
            : undefined,
          eq(invoice.invoiceType, SALE_LOCAL_ONLY),
          sql`${payment.clientId} IS NOT NULL`,
        );

    // Map sort IDs to actual payment table columns
    const columnMap = {
      id: payment.id,
      date: payment.paymentDate,
      paymentDate: payment.paymentDate,
      clientId: payment.clientId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
          .map((item) => {
            const column = columnMap[item.id as keyof typeof columnMap];
            if (!column) return null;
            return item.desc ? desc(column) : asc(column);
          })
          .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(payment.paymentDate), desc(payment.createdAt)]; // paymentDate is the actual DB column

    const { data, total } = await db.transaction(async (tx) => {
      // Get payments with invoice and client info
      const paymentsData = await tx
        .select({
          payment: {
            id: payment.id,
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            invoiceId: payment.invoiceId,
            clientId: payment.clientId,
          },
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            totalAmount: invoice.totalAmount,
            currency: invoice.currency,
          },
          client: {
            id: partner.id,
            name: partner.name,
          },
        })
        .from(payment)
        .innerJoin(invoice, eq(payment.invoiceId, invoice.id))
        .leftJoin(partner, eq(payment.clientId, partner.id))
        .where(where || undefined)
        .limit(input.perPage)
        .offset(offset)
        .orderBy(...orderBy);

      // Get credit note amounts (invoice cancellations) for each invoice
      const invoiceIds = paymentsData.map((p) => p.invoice.id);
      const cancellations = invoiceIds.length > 0
        ? await tx
          .select({
            originalInvoiceId: invoiceCancellation.originalInvoiceId,
            cancellationDate: invoiceCancellation.cancellationDate,
          })
          .from(invoiceCancellation)
          .where(inArray(invoiceCancellation.originalInvoiceId, invoiceIds))
        : [];

      // Get original invoice amounts for cancelled invoices
      const cancelledInvoiceIds = cancellations.map((c) => c.originalInvoiceId);
      const cancelledInvoices = cancelledInvoiceIds.length > 0
        ? await tx
          .select({
            id: invoice.id,
            totalAmount: invoice.totalAmount,
          })
          .from(invoice)
          .where(inArray(invoice.id, cancelledInvoiceIds))
        : [];

      // Create a map of invoice ID to credit note amount
      const creditNoteMap = new Map<string, string>();
      cancelledInvoices.forEach((inv) => {
        creditNoteMap.set(inv.id, inv.totalAmount || "0");
      });

      const total = await tx
        .select({
          count: count(),
        })
        .from(payment)
        .innerJoin(invoice, eq(payment.invoiceId, invoice.id))
        .where(where || undefined)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data: paymentsData.map((p) => ({
          payment: p.payment,
          invoice: p.invoice,
          client: p.client,
          creditNoteAmount: creditNoteMap.get(p.invoice.id) || "0",
        })),
        total,
      };
    });

    return {
      payments: data.map((item) => {
        const paymentDate =
          typeof item.payment.paymentDate === "string"
            ? new Date(item.payment.paymentDate + "T00:00:00")
            : new Date(item.payment.paymentDate);

        return {
          id: item.payment.id,
          date: paymentDate,
          clientName: item.client?.name || null,
          clientId: item.payment.clientId,
          invoiceNumber: item.invoice.invoiceNumber,
          invoiceId: item.invoice.id,
          saleAmount: item.invoice.totalAmount || "0",
          creditNoteAmount: item.creditNoteAmount,
          paymentMethod: item.payment.paymentMethod,
          paymentAmount: item.payment.amount || "0",
          currency: item.invoice.currency || "DZD",
        };
      }),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting sales customer payments", error);
    return {
      payments: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: 0,
      },
    };
  }
};

