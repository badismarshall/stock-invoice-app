"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetInvoicesSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getInvoices as getInvoicesDAL } from "@/data/invoice/invoice.dal";

/**
 * Get invoices by IDs for export
 */
export async function getInvoicesByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Use getInvoicesDAL with a filter to get only the invoices we need
    // We'll use a workaround: get all and filter, or use advanced filters
    // For now, let's get all and filter in memory (not ideal but works)
    const result = await getInvoicesDAL({
      page: 1,
      perPage: 10000,
      sort: [],
      filters: [],
      invoiceType: [] as ("sale_local" | "sale_export" | "proforma" | "purchase" | "delivery_note_invoice")[],
      paymentStatus: [] as ("unpaid" | "partially_paid" | "paid")[],
      status: [] as ("active" | "cancelled")[],
      clientId: [],
      supplierId: [],
      invoiceDate: [],
      dueDate: [],
      createdAt: [],
      invoiceNumber: "",
      joinOperator: "and",
    });

    // Filter by IDs
    const invoices = result.invoices.filter((inv) => input.ids.includes(inv.id));

    return {
      data: invoices,
      error: null,
    };
  } catch (err) {
    console.error("Error getting invoices by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered invoices for export based on table filters
 */
export async function getFilteredInvoicesForExport(input: GetInvoicesSchema) {
  try {
    const validFilters = getValidFilters(input.filters);

    // Convert invoiceType from string[] to the expected enum type
    const invoiceType = Array.isArray(input.invoiceType)
      ? input.invoiceType.filter((type): type is "sale_local" | "sale_export" | "proforma" | "purchase" | "delivery_note_invoice" =>
          ["sale_local", "sale_export", "proforma", "purchase", "delivery_note_invoice"].includes(type)
        )
      : [];

    // Convert paymentStatus from string[] to the expected enum type
    const paymentStatus = Array.isArray(input.paymentStatus)
      ? input.paymentStatus.filter((status): status is "unpaid" | "partially_paid" | "paid" =>
          ["unpaid", "partially_paid", "paid"].includes(status)
        )
      : [];

    // Convert status from string[] to the expected enum type
    const status = Array.isArray(input.status)
      ? input.status.filter((s): s is "active" | "cancelled" =>
          ["active", "cancelled"].includes(s)
        )
      : [];

    // Convert date arrays from number[] (timestamps) to Date[]
    const invoiceDate = Array.isArray(input.invoiceDate)
      ? input.invoiceDate.map((ts) => new Date(ts))
      : [];
    const dueDate = Array.isArray(input.dueDate)
      ? input.dueDate.map((ts) => new Date(ts))
      : [];
    const createdAt = Array.isArray(input.createdAt)
      ? input.createdAt.map((ts) => new Date(ts))
      : [];

    // Get all invoices matching filters (use a large perPage to get all)
    const result = await getInvoicesDAL({
      ...input,
      perPage: 10000, // Large number to get all matching invoices
      filters: validFilters,
      invoiceType,
      paymentStatus,
      status,
      invoiceDate,
      dueDate,
      createdAt,
      filterFlag: input.filterFlag ?? undefined,
    });

    return {
      data: result.invoices,
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered invoices for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

