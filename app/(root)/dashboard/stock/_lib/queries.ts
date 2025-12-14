"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getStockCurrent as getStockCurrentDAL, getStockMovements as getStockMovementsDAL } from "@/data/stock/stock.dal";
import type { GetStockCurrentSchema, GetStockMovementsSchema } from "./validation";

export async function getStockCurrentQuery(input: GetStockCurrentSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("stock");

  try {
    const result = await getStockCurrentDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.stock, 
      pageCount,
      summary: result.summary,
    };
  } catch (error) {
    console.error("Error in getStockCurrentQuery service", error);
    return { 
      data: [], 
      pageCount: 0,
      summary: {
        totalStockValue: 0,
        totalProducts: 0,
        lowStockCount: 0,
      },
    };
  }
}

export async function getStockMovementsQuery(input: GetStockMovementsSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("stockMovements");

  try {
    const result = await getStockMovementsDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.movements, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getStockMovementsQuery service", error);
    return { data: [], pageCount: 0 };
  }
}

