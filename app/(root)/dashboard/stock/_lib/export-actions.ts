"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetStockCurrentSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { stockCurrent, product, category, unitOfMeasure } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or, sql, ne, notInArray, lt, gt } from "drizzle-orm";

/**
 * Get stock by IDs for export
 */
export async function getStockByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const stock = await db
      .select({
        stock: stockCurrent,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
        },
        category: {
          id: category.id,
          name: category.name,
        },
        unitOfMeasure: {
          id: unitOfMeasure.id,
          name: unitOfMeasure.name,
          symbol: unitOfMeasure.symbol,
        },
      })
      .from(stockCurrent)
      .leftJoin(product, eq(stockCurrent.productId, product.id))
      .leftJoin(category, eq(product.categoryId, category.id))
      .leftJoin(unitOfMeasure, eq(product.unitOfMeasureId, unitOfMeasure.id))
      .where(inArray(stockCurrent.id, input.ids))
      .orderBy(asc(product.name));
    
    return {
      data: stock.map((s) => {
        const quantity = parseFloat(s.stock.quantityAvailable || "0");
        const avgCost = parseFloat(s.stock.averageCost || "0");
        const stockValue = quantity * avgCost;
        
        return {
          id: s.stock.id,
          productId: s.stock.productId,
          productCode: s.product?.code || null,
          productName: s.product?.name || null,
          categoryName: s.category?.name || null,
          unitOfMeasure: s.unitOfMeasure?.symbol || s.unitOfMeasure?.name || null,
          quantityAvailable: quantity,
          averageCost: avgCost,
          stockValue: stockValue,
          lastMovementDate: s.stock.lastMovementDate ? new Date(s.stock.lastMovementDate) : null,
          lastUpdated: s.stock.lastUpdated,
        };
      }),
      error: null,
    };
  } catch (err) {
    console.error("Error getting stock by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered stock for export based on table filters
 */
export async function getFilteredStockForExport(input: GetStockCurrentSchema) {
  try {
    const validFilters = getValidFilters(input.filters);
    const advancedTable = input.filterFlag === "advancedFilters" || input.filterFlag === "commandFilters";
    
    // Map filter IDs to actual database columns (handling joins)
    const columnMapForFilters: Record<string, any> = {
      id: stockCurrent.id,
      productId: stockCurrent.productId,
      productCode: product.code,
      productName: product.name,
      categoryName: product.categoryId,
      categoryId: product.categoryId,
      unitOfMeasureId: product.unitOfMeasureId,
      quantityAvailable: stockCurrent.quantityAvailable,
      averageCost: stockCurrent.averageCost,
      stockValue: sql`CAST(${stockCurrent.quantityAvailable} AS NUMERIC) * CAST(${stockCurrent.averageCost} AS NUMERIC)`,
      lastMovementDate: stockCurrent.lastMovementDate,
      lastUpdated: stockCurrent.lastUpdated,
    };

    // Build advanced filters
    const advancedWhere = validFilters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = validFilters.map((filter: any) => {
            if (!filter.operator) return undefined;
            
            const column = columnMapForFilters[filter.id];
            if (!column) return undefined;

            const isDateType = filter.id === "lastMovementDate";
            const isTimestampType = filter.id === "lastUpdated";

            switch (filter.operator) {
              case "iLike":
                return filter.variant === "text" && typeof filter.value === "string"
                  ? ilike(column, `%${filter.value}%`)
                  : undefined;

              case "notILike":
                return filter.variant === "text" && typeof filter.value === "string"
                  ? sql`NOT (${column}::text ILIKE ${`%${filter.value}%`})`
                  : undefined;

              case "eq":
                if (column.dataType === "boolean" && typeof filter.value === "string") {
                  return eq(column, filter.value === "true");
                }
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return eq(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const end = new Date(date);
                    end.setHours(23, 59, 59, 999);
                    return and(gte(column, date), lte(column, end));
                  }
                }
                return eq(column, filter.value);

              case "ne":
                if (column.dataType === "boolean" && typeof filter.value === "string") {
                  return ne(column, filter.value === "true");
                }
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return ne(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const end = new Date(date);
                    end.setHours(23, 59, 59, 999);
                    return or(lt(column, date), gt(column, end));
                  }
                }
                return ne(column, filter.value);

              case "lt":
                if (filter.variant === "number" || filter.variant === "range") {
                  return lt(column, filter.value);
                }
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return lt(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(23, 59, 59, 999);
                    return lt(column, date);
                  }
                }
                return undefined;

              case "lte":
                if (filter.variant === "number" || filter.variant === "range") {
                  return lte(column, filter.value);
                }
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return lte(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(23, 59, 59, 999);
                    return lte(column, date);
                  }
                }
                return undefined;

              case "gt":
                if (filter.variant === "number" || filter.variant === "range") {
                  return gt(column, filter.value);
                }
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return gt(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return gt(column, date);
                  }
                }
                return undefined;

              case "gte":
                if (filter.variant === "number" || filter.variant === "range") {
                  return gte(column, filter.value);
                }
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return gte(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return gte(column, date);
                  }
                }
                return undefined;

              case "isBetween":
                if (
                  (filter.variant === "date" || filter.variant === "dateRange") &&
                  Array.isArray(filter.value) &&
                  filter.value.length === 2
                ) {
                  if (isDateType) {
                    const formatDate = (val: string | number) => {
                      const date = new Date(Number(val));
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    };
                    return and(
                      filter.value[0] ? gte(column, formatDate(filter.value[0])) : undefined,
                      filter.value[1] ? lte(column, formatDate(filter.value[1])) : undefined,
                    );
                  } else if (isTimestampType) {
                    return and(
                      filter.value[0]
                        ? gte(
                            column,
                            (() => {
                              const date = new Date(Number(filter.value[0]));
                              date.setHours(0, 0, 0, 0);
                              return date;
                            })(),
                          )
                        : undefined,
                      filter.value[1]
                        ? lte(
                            column,
                            (() => {
                              const date = new Date(Number(filter.value[1]));
                              date.setHours(23, 59, 59, 999);
                              return date;
                            })(),
                          )
                        : undefined,
                    );
                  }
                }
                return undefined;

              case "inArray":
                if (Array.isArray(filter.value)) {
                  return inArray(column, filter.value);
                }
                return undefined;

              case "notInArray":
                if (Array.isArray(filter.value)) {
                  return notInArray(column, filter.value as any[]);
                }
                return undefined;

              case "isEmpty":
                return sql`${column} IS NULL`;

              case "isNotEmpty":
                return sql`${column} IS NOT NULL`;

              default:
                return undefined;
            }
          });

          const validConditions = conditions.filter(
            (condition: any) => condition !== undefined,
          );

          return validConditions.length > 0 ? joinFn(...validConditions) : undefined;
        })()
      : undefined;

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by product code or name
          input.productCode || input.productName
            ? or(
                input.productCode ? ilike(product.code, `%${input.productCode}%`) : undefined,
                input.productName ? ilike(product.name, `%${input.productName}%`) : undefined,
              )
            : undefined,
          // Filter by category
          input.categoryId && input.categoryId.length > 0
            ? inArray(product.categoryId, input.categoryId)
            : undefined,
          // Filter by lastMovementDate date range
          input.lastMovementDate.length > 0
            ? and(
                input.lastMovementDate[0]
                  ? gte(
                      stockCurrent.lastMovementDate,
                      (() => {
                        const date = new Date(input.lastMovementDate[0]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
                input.lastMovementDate[1]
                  ? lte(
                      stockCurrent.lastMovementDate,
                      (() => {
                        const date = new Date(input.lastMovementDate[1]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
          // Filter by lastUpdated date range
          input.lastUpdated.length > 0
            ? and(
                input.lastUpdated[0]
                  ? gte(
                      stockCurrent.lastUpdated,
                      (() => {
                        const date = new Date(input.lastUpdated[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.lastUpdated[1]
                  ? lte(
                      stockCurrent.lastUpdated,
                      (() => {
                        const date = new Date(input.lastUpdated[1]);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
        );
    
    // Get all stock matching filters
    const stock = await db
      .select({
        stock: stockCurrent,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
        },
        category: {
          id: category.id,
          name: category.name,
        },
        unitOfMeasure: {
          id: unitOfMeasure.id,
          name: unitOfMeasure.name,
          symbol: unitOfMeasure.symbol,
        },
      })
      .from(stockCurrent)
      .leftJoin(product, eq(stockCurrent.productId, product.id))
      .leftJoin(category, eq(product.categoryId, category.id))
      .leftJoin(unitOfMeasure, eq(product.unitOfMeasureId, unitOfMeasure.id))
      .where(where)
      .orderBy(asc(product.name));
    
    return {
      data: stock.map((s) => {
        const quantity = parseFloat(s.stock.quantityAvailable || "0");
        const avgCost = parseFloat(s.stock.averageCost || "0");
        const stockValue = quantity * avgCost;
        
        return {
          id: s.stock.id,
          productId: s.stock.productId,
          productCode: s.product?.code || null,
          productName: s.product?.name || null,
          categoryName: s.category?.name || null,
          unitOfMeasure: s.unitOfMeasure?.symbol || s.unitOfMeasure?.name || null,
          quantityAvailable: quantity,
          averageCost: avgCost,
          stockValue: stockValue,
          lastMovementDate: s.stock.lastMovementDate ? new Date(s.stock.lastMovementDate) : null,
          lastUpdated: s.stock.lastUpdated,
        };
      }),
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered stock for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}


