"use server";

import { getErrorMessage } from "@/lib/handle-error";
import { getSalesCustomerPayments as getSalesCustomerPaymentsDAL } from "@/data/sales-customer-payment/sales-customer-payment.dal";
import { getAllClients } from "../../../sales/_lib/actions";

export async function getSalesCustomerPaymentsForTable(input: {
  page?: number;
  perPage?: number;
  sort?: Array<{ id: string; desc: boolean }>;
  filters?: any;
  filterFlag?: "filters" | "advancedFilters" | "commandFilters";
  joinOperator?: "and" | "or";
  startDate?: string;
  endDate?: string;
  clientId?: string[];
  paymentMethod?: string[];
  date?: number[];
  invoiceNumber?: string;
}) {
  try {
    const result = await getSalesCustomerPaymentsDAL({
      page: input.page || 1,
      perPage: input.perPage || 10,
      sort: input.sort || [],
      filters: input.filters || [],
      filterFlag: input.filterFlag,
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
    console.error("Error getting sales customer payments", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

export async function getAllClientsForPayments() {
  try {
    const result = await getAllClients();
    return {
      data: result.data || [],
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


