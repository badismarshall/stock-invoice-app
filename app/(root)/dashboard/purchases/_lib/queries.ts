"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getPurchaseOrders as getPurchaseOrdersDAL } from "@/data/purchase-order/purchase-order.dal";
import type { GetPurchaseOrdersSchema } from "./validation";

export async function getPurchaseOrders(input: GetPurchaseOrdersSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("purchaseOrders");

  try {
    const result = await getPurchaseOrdersDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.purchaseOrders, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getPurchaseOrders service", error);
    return { data: [], pageCount: 0 };
  }
}

