"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getInvoices as getInvoicesDAL } from "@/data/invoice/invoice.dal";
import type { GetInvoicesSchema } from "./validation";

export async function getInvoices(input: GetInvoicesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("invoices");

  try {
    const result = await getInvoicesDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.invoices, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getInvoices service", error);
    return { data: [], pageCount: 0 };
  }
}

