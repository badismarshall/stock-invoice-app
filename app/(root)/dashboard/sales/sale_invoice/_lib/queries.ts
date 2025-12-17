"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getInvoices as getInvoicesDAL } from "@/data/invoice/invoice.dal";
import type { GetSaleInvoicesSchema } from "./validation";

export async function getSaleInvoices(input: GetSaleInvoicesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("invoices");

  try {
    // Force invoiceType to only include sale_invoice
    const result = await getInvoicesDAL({
      ...input,
      invoiceType: ["sale_invoice"],
    });
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.invoices, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getSaleInvoices service", error);
    return { data: [], pageCount: 0 };
  }
}

