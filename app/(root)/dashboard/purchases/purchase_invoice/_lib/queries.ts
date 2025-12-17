"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getInvoices as getInvoicesDAL } from "@/data/invoice/invoice.dal";
import type { GetPurchaseInvoicesSchema } from "./validation";

export async function getPurchaseInvoices(input: GetPurchaseInvoicesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("invoices");

  try {
    // Force invoiceType to only include purchase
    const result = await getInvoicesDAL({
      ...input,
      invoiceType: ["purchase"],
    });
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.invoices, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getPurchaseInvoices service", error);
    return { data: [], pageCount: 0 };
  }
}

