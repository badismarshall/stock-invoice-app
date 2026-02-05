"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getSalesCustomerPayments as getSalesCustomerPaymentsDAL } from "@/data/sales-customer-payment/sales-customer-payment.dal";
import type { GetSalesCustomerPaymentsSchema } from "./validation";

export async function getSalesCustomerPayments(input: GetSalesCustomerPaymentsSchema & { startDate?: string; endDate?: string; clientId?: string[]; date?: number[]; invoiceNumber?: string }) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("salesCustomerPayments");

  try {
    const result = await getSalesCustomerPaymentsDAL({
      page: input.page,
      perPage: input.perPage,
      sort: input.sort,
      filters: input.filters,
      filterFlag: input.filterFlag || undefined,
      joinOperator: input.joinOperator,
      startDate: input.startDate,
      endDate: input.endDate,
      clientId: input.clientId,
      paymentMethod: input.paymentMethod,
      date: input.date,
      invoiceNumber: input.invoiceNumber,
    });
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.payments, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getSalesCustomerPayments service", error);
    return { data: [], pageCount: 0 };
  }
}


