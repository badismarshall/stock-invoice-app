"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getProducts as getProductsDAL } from "@/data/product/product.dal";
import type { GetProductsSchema } from "./validation";

export async function getProducts(input: GetProductsSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("products");

  try {
    const result = await getProductsDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.products, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getProducts service", error);
    return { data: [], pageCount: 0 };
  }
}

