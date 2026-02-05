"use server";

import { getErrorMessage } from "@/lib/handle-error";
import { getSalesCustomerPayments as getSalesCustomerPaymentsDAL } from "@/data/sales-customer-payment/sales-customer-payment.dal";
import type { GetSalesCustomerPaymentsSchema } from "./validation";

export async function getFilteredSalesCustomerPaymentsForExport(input: GetSalesCustomerPaymentsSchema & { startDate?: string; endDate?: string; clientId?: string[]; date?: number[]; invoiceNumber?: string }) {
  try {
    const result = await getSalesCustomerPaymentsDAL({
      page: 1,
      perPage: 100000, // Get all for export
      sort: input.sort || [{ id: "date", desc: true }],
      filters: input.filters || [],
      filterFlag: input.filterFlag || undefined,
      joinOperator: input.joinOperator || "and",
      startDate: input.startDate,
      endDate: input.endDate,
      clientId: input.clientId || [],
      paymentMethod: input.paymentMethod || [],
      date: input.date,
      invoiceNumber: input.invoiceNumber,
    });

    return {
      data: result.payments,
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered sales customer payments for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}


