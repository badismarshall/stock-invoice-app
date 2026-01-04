"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getUnitsOfMeasure as getUnitsOfMeasureDAL } from "@/data/unit-of-measure/unit-of-measure.dal";
import type { GetUnitsOfMeasureSchema } from "./validation";

export async function getUnitsOfMeasure(input: GetUnitsOfMeasureSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("unitsOfMeasure");

  try {
    const result = await getUnitsOfMeasureDAL(input);
    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    
    return { 
      data: result.unitsOfMeasure, 
      pageCount 
    };
  } catch (error) {
    console.error("Error in getUnitsOfMeasure service", error);
    return { data: [], pageCount: 0 };
  }
}

