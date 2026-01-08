"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetProformaInvoicesSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getProformaInvoices } from "./queries";

/**
 * Get proforma invoices by IDs for export
 */
export async function getProformaInvoicesByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Get all proforma invoices (we'll filter by IDs in memory)
    // Use a large perPage to get all invoices, then filter
    const result = await getProformaInvoices({
      page: 1,
      perPage: 10000,
      sort: [],
      filters: [],
      paymentStatus: [],
      status: [],
      clientId: [],
      supplierId: [],
      invoiceDate: [],
      dueDate: [],
      createdAt: [],
      invoiceNumber: "",
      search: "",
      filterFlag: null,
      joinOperator: "and",
    });

    // Filter by IDs
    const invoices = result.data.filter((inv) => input.ids.includes(inv.id));

    return {
      data: invoices,
      error: null,
    };
  } catch (err) {
    console.error("Error getting proforma invoices by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered proforma invoices for export based on table filters
 */
export async function getFilteredProformaInvoicesForExport(input: GetProformaInvoicesSchema) {
  try {
    const validFilters = getValidFilters(input.filters);

    // Get all proforma invoices matching filters (use a large perPage to get all)
    const result = await getProformaInvoices({
      ...input,
      perPage: 10000, // Large number to get all matching invoices
      filters: validFilters,
    });

    return {
      data: result.data,
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered proforma invoices for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

