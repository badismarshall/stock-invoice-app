import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
} from "drizzle-orm";
import db from "@/db";
import { unitOfMeasure } from "@/db/schema";
import type { GetUnitsOfMeasureSchema } from "@/app/(root)/dashboard/products/unit-of-measure/_lib/validation";
import type { UnitOfMeasureDTO } from "./unit-of-measure.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

export const getUnitsOfMeasure = async (input: GetUnitsOfMeasureSchema): Promise<UnitOfMeasureDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: unitOfMeasure,
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by name or symbol
          input.name || input.symbol
            ? or(
                input.name ? ilike(unitOfMeasure.name, `%${input.name}%`) : undefined,
                input.symbol ? ilike(unitOfMeasure.symbol, `%${input.symbol}%`) : undefined,
              )
            : undefined,
          // Filter by isActive
          input.isActive && input.isActive.length > 0
            ? or(...input.isActive.map((active) => eq(unitOfMeasure.isActive, active === "true")))
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

    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(unitOfMeasure)
        .limit(input.perPage)
        .offset(offset)
        .where(where)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(unitOfMeasure)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    return {
      unitsOfMeasure: data.map((u) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        description: u.description,
        isActive: u.isActive ?? false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting units of measure", error);
    return {
      unitsOfMeasure: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: 0,
      },
    };
  }
};

export const getUnitOfMeasureById = async (id: string) => {
  try {
    const result = await db
      .select()
      .from(unitOfMeasure)
      .where(eq(unitOfMeasure.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    return {
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      description: item.description,
      isActive: item.isActive ?? false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } catch (error) {
    console.error("Error getting unit of measure by ID", error);
    return null;
  }
};

