"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetProductsSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { product, category, unitOfMeasure } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or, sql, ne, notInArray, lt, gt } from "drizzle-orm";

/**
 * Get products by IDs for export
 */
export async function getProductsByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const products = await db
      .select({
        product: product,
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
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .leftJoin(unitOfMeasure, eq(product.unitOfMeasureId, unitOfMeasure.id))
      .where(inArray(product.id, input.ids))
      .orderBy(asc(product.name));
    
    return {
      data: products.map((p) => ({
        id: p.product.id,
        code: p.product.code,
        name: p.product.name,
        description: p.product.description,
        categoryId: p.product.categoryId,
        categoryName: p.category?.name || null,
        unitOfMeasureId: p.product.unitOfMeasureId,
        unitOfMeasureName: p.unitOfMeasure?.name || null,
        unitOfMeasureSymbol: p.unitOfMeasure?.symbol || null,
        purchasePrice: p.product.purchasePrice,
        salePriceLocal: p.product.salePriceLocal,
        salePriceExport: p.product.salePriceExport,
        taxRate: p.product.taxRate,
        isActive: p.product.isActive ?? true,
        createdAt: p.product.createdAt,
        updatedAt: p.product.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting products by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered products for export based on table filters
 */
export async function getFilteredProductsForExport(input: GetProductsSchema) {
  try {
    const validFilters = getValidFilters(input.filters);
    const advancedTable = input.filterFlag === "advancedFilters" || input.filterFlag === "commandFilters";
    
    // Build advanced filters
    const advancedWhere = validFilters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = validFilters.map((filter: any) => {
            if (!filter.operator) return undefined;
            
            // Get the column
            let column: any;
            switch (filter.id) {
              case "code":
                column = product.code;
                break;
              case "name":
                column = product.name;
                break;
              case "categoryId":
                column = product.categoryId;
                break;
              case "unitOfMeasureId":
                column = product.unitOfMeasureId;
                break;
              case "isActive":
                column = product.isActive;
                break;
              case "createdAt":
                column = product.createdAt;
                break;
              default:
                return undefined;
            }

            const isTimestampType = filter.id === "createdAt";

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
                  if (isTimestampType) {
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
                  if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const end = new Date(date);
                    end.setHours(23, 59, 59, 999);
                    return or(lt(column, date), gt(column, end));
                  }
                }
                return ne(column, filter.value);

              case "lt":
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(23, 59, 59, 999);
                    return lt(column, date);
                  }
                }
                return filter.variant === "number" || filter.variant === "range"
                  ? lt(column, filter.value)
                  : undefined;

              case "lte":
                if (isTimestampType) {
                  const date = new Date(Number(filter.value));
                  date.setHours(23, 59, 59, 999);
                  return lte(column, date);
                }
                return filter.variant === "number" || filter.variant === "range"
                  ? lte(column, filter.value)
                  : undefined;

              case "gt":
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return gt(column, date);
                  }
                }
                return filter.variant === "number" || filter.variant === "range"
                  ? gt(column, filter.value)
                  : undefined;

              case "gte":
                if (isTimestampType) {
                  const date = new Date(Number(filter.value));
                  date.setHours(0, 0, 0, 0);
                  return gte(column, date);
                }
                return filter.variant === "number" || filter.variant === "range"
                  ? gte(column, filter.value)
                  : undefined;

              case "isBetween":
                if (
                  (filter.variant === "date" || filter.variant === "dateRange") &&
                  Array.isArray(filter.value) &&
                  filter.value.length === 2
                ) {
                  if (isTimestampType) {
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
          // Search by name or code
          input.name || input.code
            ? or(
                input.name ? ilike(product.name, `%${input.name}%`) : undefined,
                input.code ? ilike(product.code, `%${input.code}%`) : undefined,
              )
            : undefined,
          // Filter by category
          input.categoryId && input.categoryId.length > 0
            ? inArray(product.categoryId, input.categoryId)
            : undefined,
          // Filter by unit of measure
          input.unitOfMeasureId && input.unitOfMeasureId.length > 0
            ? inArray(product.unitOfMeasureId, input.unitOfMeasureId)
            : undefined,
          // Filter by isActive (convert string to boolean)
          input.isActive && input.isActive.length > 0
            ? inArray(product.isActive, input.isActive.map((active) => active === "true"))
            : undefined,
          // Filter by createdAt date range
          input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      product.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      product.createdAt,
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
    
    // Get all products matching filters
    const products = await db
      .select({
        product: product,
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
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .leftJoin(unitOfMeasure, eq(product.unitOfMeasureId, unitOfMeasure.id))
      .where(where)
      .orderBy(asc(product.name));
    
    return {
      data: products.map((p) => ({
        id: p.product.id,
        code: p.product.code,
        name: p.product.name,
        description: p.product.description,
        categoryId: p.product.categoryId,
        categoryName: p.category?.name || null,
        unitOfMeasureId: p.product.unitOfMeasureId,
        unitOfMeasureName: p.unitOfMeasure?.name || null,
        unitOfMeasureSymbol: p.unitOfMeasure?.symbol || null,
        purchasePrice: p.product.purchasePrice,
        salePriceLocal: p.product.salePriceLocal,
        salePriceExport: p.product.salePriceExport,
        taxRate: p.product.taxRate,
        isActive: p.product.isActive ?? true,
        createdAt: p.product.createdAt,
        updatedAt: p.product.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered products for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

