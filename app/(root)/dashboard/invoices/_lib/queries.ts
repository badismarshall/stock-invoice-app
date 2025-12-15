"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getInvoices as getInvoicesDAL } from "@/data/invoice/invoice.dal";
import { GetInvoicesSchema } from "./validation";
import { z } from "zod";

export async function getInvoicesQuery(input: z.infer<typeof GetInvoicesSchema>) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("invoices");

  try {
    const result = await getInvoicesDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.invoices, 
      pageCount,
      summary: result.summary,
    };
  } catch (error) {
    console.error("Error in getInvoicesQuery service", error);
    return { 
      data: [], 
      pageCount: 0,
      summary: {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        partiallyPaidAmount: 0,
        unpaidCount: 0,
        partiallyPaidCount: 0,
        paidCount: 0,
        overdueCount: 0,
      },
    };
  }
}

