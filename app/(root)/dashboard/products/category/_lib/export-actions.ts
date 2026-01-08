"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetCategoriesSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { category } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or } from "drizzle-orm";
import { filterColumns } from "@/lib/data-table/filter-columns";

/**
 * Get categories by IDs for export
 */
export async function getCategoriesByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const categories = await db
      .select()
      .from(category)
      .where(inArray(category.id, input.ids))
      .orderBy(asc(category.name));
    
    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isActive: c.isActive ?? false,
        createdAt: c.createdAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting categories by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered categories for export based on table filters
 */
export async function getFilteredCategoriesForExport(input: GetCategoriesSchema) {
  try {
    const validFilters = getValidFilters(input.filters);
    const advancedTable = input.filterFlag === "advancedFilters" || input.filterFlag === "commandFilters";
    
    // Build advanced filters
    const advancedWhere = validFilters.length > 0
      ? filterColumns({
          table: category,
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
            ? ilike(category.name, `%${input.name}%`)
            : undefined,
          // Filter by createdAt date range
          input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      category.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      category.createdAt,
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

    // Map sort IDs to actual category table columns
    const columnMap = {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
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
        : [desc(category.createdAt)];

    // Get all categories matching filters (no pagination for export)
    const categories = await db
      .select()
      .from(category)
      .where(where)
      .orderBy(...orderBy)
      .limit(10000); // Large limit for export
    
    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isActive: c.isActive ?? false,
        createdAt: c.createdAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered categories for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

