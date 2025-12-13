"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getCategories as getCategoriesDAL } from "@/data/category/category.dal";
import type { GetCategoriesSchema } from "./validation";

export async function getCategories(input: GetCategoriesSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("categories");

  try {
    const result = await getCategoriesDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.categories, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getCategories service", error);
    return { data: [], pageCount: 0 };
  }
}

