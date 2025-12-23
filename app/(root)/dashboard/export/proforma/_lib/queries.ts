"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getInvoices as getInvoicesDAL } from "@/data/invoice/invoice.dal";
import type { GetProformaInvoicesSchema } from "./validation";

// Valid enum values
const validPaymentStatuses = ["unpaid", "partially_paid", "paid"] as const;
const validStatuses = ["active", "cancelled"] as const;

type ValidPaymentStatus = typeof validPaymentStatuses[number];
type ValidStatus = typeof validStatuses[number];

export async function getProformaInvoices(input: GetProformaInvoicesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("invoices");

  try {
    // Convert enum arrays from string[] to the expected types
    const paymentStatus = Array.isArray(input.paymentStatus)
      ? input.paymentStatus.filter((status): status is ValidPaymentStatus => 
          validPaymentStatuses.includes(status as ValidPaymentStatus)
        )
      : [];

    const status = Array.isArray(input.status)
      ? input.status.filter((s): s is ValidStatus => 
          validStatuses.includes(s as ValidStatus)
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

    // Force invoiceType to only include proforma
    const result = await getInvoicesDAL({
      ...input,
      invoiceType: ["proforma"],
      paymentStatus,
      status,
      invoiceDate,
      dueDate,
      createdAt,
      filterFlag: input.filterFlag ?? undefined,
    });
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.invoices, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getProformaInvoices service", error);
    return { data: [], pageCount: 0 };
  }
}

