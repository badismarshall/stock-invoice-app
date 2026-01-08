"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetUnitsOfMeasureSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { unitOfMeasure } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or } from "drizzle-orm";
import { filterColumns } from "@/lib/data-table/filter-columns";

/**
 * Get units of measure by IDs for export
 */
export async function getUnitsOfMeasureByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const units = await db
      .select()
      .from(unitOfMeasure)
      .where(inArray(unitOfMeasure.id, input.ids))
      .orderBy(asc(unitOfMeasure.name));
    
    return {
      data: units.map((u) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        description: u.description,
        isActive: u.isActive ?? false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting units of measure by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered units of measure for export based on table filters
 */
export async function getFilteredUnitsOfMeasureForExport(input: GetUnitsOfMeasureSchema) {
  try {
    const validFilters = getValidFilters(input.filters);
    const advancedTable = input.filterFlag === "advancedFilters" || input.filterFlag === "commandFilters";
    
    // Build advanced filters
    const advancedWhere = validFilters.length > 0
      ? filterColumns({
          table: unitOfMeasure,
          filters: validFilters,
          joinOperator: input.joinOperator,
        })
      : undefined;

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by name
          input.name
            ? ilike(unitOfMeasure.name, `%${input.name}%`)
            : undefined,
          // Search by symbol
          input.symbol
            ? ilike(unitOfMeasure.symbol, `%${input.symbol}%`)
            : undefined,
          // Filter by isActive
          input.isActive.length > 0
            ? or(
                ...input.isActive.map((status) => {
                  if (status === "true") {
                    return eq(unitOfMeasure.isActive, true);
                  } else if (status === "false") {
                    return eq(unitOfMeasure.isActive, false);
                  }
                  return undefined;
                }).filter((condition): condition is ReturnType<typeof eq> => condition !== undefined)
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      unitOfMeasure.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      unitOfMeasure.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[1]);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
        );

    // Map sort IDs to actual unitOfMeasure table columns
    const columnMap = {
      id: unitOfMeasure.id,
      name: unitOfMeasure.name,
      symbol: unitOfMeasure.symbol,
      description: unitOfMeasure.description,
      isActive: unitOfMeasure.isActive,
      createdAt: unitOfMeasure.createdAt,
      updatedAt: unitOfMeasure.updatedAt,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
            .map((item) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(unitOfMeasure.createdAt)];

    // Get all units of measure matching filters (no pagination for export)
    const units = await db
      .select()
      .from(unitOfMeasure)
      .where(where)
      .orderBy(...orderBy)
      .limit(10000); // Large limit for export
    
    return {
      data: units.map((u) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        description: u.description,
        isActive: u.isActive ?? false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered units of measure for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

