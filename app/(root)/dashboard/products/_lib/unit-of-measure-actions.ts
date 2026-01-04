"use server";

import { getErrorMessage } from "@/lib/handle-error";
import db from "@/db";
import { unitOfMeasure } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getAllActiveUnitsOfMeasure() {
  try {
    const units = await db
      .select({
        id: unitOfMeasure.id,
        name: unitOfMeasure.name,
        symbol: unitOfMeasure.symbol,
      })
      .from(unitOfMeasure)
      .where(eq(unitOfMeasure.isActive, true))
      .orderBy(asc(unitOfMeasure.name));

    return {
      data: units,
      error: null,
    };
  } catch (err) {
    console.error("Error getting active units of measure", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

