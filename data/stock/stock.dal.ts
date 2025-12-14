import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  ne,
  not,
  notIlike,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { addDays, endOfDay, startOfDay } from "date-fns";
import db from "@/db";
import { stockCurrent, stockMovement, product, category, user } from "@/db/schema";
import type { GetStockCurrentSchema, GetStockMovementsSchema } from "@/app/(root)/dashboard/stock/_lib/validation";
import type { StockCurrentDTO, StockMovementDTO, StockMovementDTOItem } from "./stock.dto";
import { isEmpty } from "@/db/utils";
import { filterColumns } from "@/lib/data-table/filter-columns";

export const getStockCurrent = async (input: GetStockCurrentSchema): Promise<StockCurrentDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    // Map filter IDs to actual database columns (handling joins)
    const columnMapForFilters: Record<string, any> = {
      id: stockCurrent.id,
      productId: stockCurrent.productId,
      productCode: product.code,
      productName: product.name,
      categoryName: product.categoryId, // Map categoryName filter to product.categoryId for multiSelect
      categoryId: product.categoryId,
      unitOfMeasure: product.unitOfMeasure,
      quantityAvailable: stockCurrent.quantityAvailable,
      averageCost: stockCurrent.averageCost,
      stockValue: sql`CAST(${stockCurrent.quantityAvailable} AS NUMERIC) * CAST(${stockCurrent.averageCost} AS NUMERIC)`,
      lastMovementDate: stockCurrent.lastMovementDate,
      lastUpdated: stockCurrent.lastUpdated,
    };

    // Build advanced filters with proper column mapping
    const advancedWhere = input.filters && input.filters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = input.filters.map((filter: any) => {
            const column = columnMapForFilters[filter.id];
            if (!column) return undefined;

            switch (filter.operator) {
              case "iLike":
                return filter.variant === "text" && typeof filter.value === "string"
                  ? ilike(column, `%${filter.value}%`)
                  : undefined;
              case "notILike":
                return filter.variant === "text" && typeof filter.value === "string"
                  ? notIlike(column, `%${filter.value}%`)
                  : undefined;
              case "eq":
                if (column.dataType === "boolean" && typeof filter.value === "string") {
                  return eq(column, filter.value === "true");
                }
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  // Check if column is a date type (not timestamp)
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return eq(column, dateStr);
                  } else {
                    // For timestamp columns, use Date object
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
                  // Check if column is a date type (not timestamp)
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return ne(column, dateStr);
                  } else {
                    // For timestamp columns, use Date object
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const end = new Date(date);
                    end.setHours(23, 59, 59, 999);
                    return or(lt(column, date), gt(column, end));
                  }
                }
                return ne(column, filter.value);
              case "inArray":
                return Array.isArray(filter.value) ? inArray(column, filter.value) : undefined;
              case "notInArray":
                return Array.isArray(filter.value) ? notInArray(column, filter.value) : undefined;
              case "lt":
                if (filter.variant === "number" || filter.variant === "range") {
                  return lt(column, filter.value);
                }
                if (filter.variant === "date" && typeof filter.value === "string") {
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return lt(column, dateStr);
                  } else {
                    // For timestamp columns, use Date object
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
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return lte(column, dateStr);
                  } else {
                    // For timestamp columns, use Date object
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
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return gt(column, dateStr);
                  } else {
                    // For timestamp columns, use Date object
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
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return gte(column, dateStr);
                  } else {
                    // For timestamp columns, use Date object
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
                  const isDateType = filter.id === "lastMovementDate";
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    return and(
                      filter.value[0]
                        ? gte(
                            column,
                            (() => {
                              const date = new Date(Number(filter.value[0]));
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            })(),
                          )
                        : undefined,
                      filter.value[1]
                        ? lte(
                            column,
                            (() => {
                              const date = new Date(Number(filter.value[1]));
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            })(),
                          )
                        : undefined,
                    );
                  } else {
                    // For timestamp columns, use Date object
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
                if (
                  (filter.variant === "number" || filter.variant === "range") &&
                  Array.isArray(filter.value) &&
                  filter.value.length === 2
                ) {
                  const firstValue =
                    filter.value[0] && String(filter.value[0]).trim() !== ""
                      ? Number(filter.value[0])
                      : null;
                  const secondValue =
                    filter.value[1] && String(filter.value[1]).trim() !== ""
                      ? Number(filter.value[1])
                      : null;

                  if (firstValue === null && secondValue === null) {
                    return undefined;
                  }

                  if (firstValue !== null && secondValue === null) {
                    return gte(column, firstValue.toString());
                  }

                  if (firstValue === null && secondValue !== null) {
                    return lte(column, secondValue.toString());
                  }

                  return and(
                    firstValue !== null ? gte(column, firstValue.toString()) : undefined,
                    secondValue !== null ? lte(column, secondValue.toString()) : undefined,
                  );
                }
                return undefined;
              case "isRelativeToToday":
                if (
                  (filter.variant === "date" || filter.variant === "dateRange") &&
                  typeof filter.value === "string"
                ) {
                  const isDateType = filter.id === "lastMovementDate";
                  const today = new Date();
                  const [amount, unit] = filter.value.split(" ") ?? [];
                  let startDate: Date;
                  let endDate: Date;

                  if (!amount || !unit) return undefined;

                  switch (unit) {
                    case "days":
                      startDate = startOfDay(
                        addDays(today, Number.parseInt(amount, 10)),
                      );
                      endDate = endOfDay(startDate);
                      break;
                    case "weeks":
                      startDate = startOfDay(
                        addDays(today, Number.parseInt(amount, 10) * 7),
                      );
                      endDate = endOfDay(addDays(startDate, 6));
                      break;
                    case "months":
                      startDate = startOfDay(
                        addDays(today, Number.parseInt(amount, 10) * 30),
                      );
                      endDate = endOfDay(addDays(startDate, 29));
                      break;
                    default:
                      return undefined;
                  }

                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const formatDateStr = (date: Date) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    };
                    return and(gte(column, formatDateStr(startDate)), lte(column, formatDateStr(endDate)));
                  } else {
                    // For timestamp columns, use Date object
                    return and(gte(column, startDate), lte(column, endDate));
                  }
                }
                return undefined;
              case "isEmpty":
                return isEmpty(column);
              case "isNotEmpty":
                return not(isEmpty(column));
              default:
                return undefined;
            }
          }).filter((condition: any) => condition !== undefined);

          return conditions.length > 0 ? joinFn(...conditions) : undefined;
        })()
      : undefined;

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by product name or code (general search)
          input.search && input.search.trim() !== ""
            ? or(
                ilike(product.name, `%${input.search}%`),
                ilike(product.code, `%${input.search}%`)
              )
            : undefined,
          // Filter by product code
          input.productCode && input.productCode.trim() !== ""
            ? ilike(product.code, `%${input.productCode}%`)
            : undefined,
          // Filter by product name
          input.productName && input.productName.trim() !== ""
            ? ilike(product.name, `%${input.productName}%`)
            : undefined,
          // Filter by category (support both categoryId and categoryName from toolbar)
          (input.categoryId && input.categoryId.length > 0) || (input.categoryName && input.categoryName.length > 0)
            ? inArray(product.categoryId, input.categoryId && input.categoryId.length > 0 ? input.categoryId : input.categoryName || [])
            : undefined,
          // Filter by quantity available (numeric comparison)
          input.quantityAvailable && input.quantityAvailable.trim() !== ""
            ? gte(stockCurrent.quantityAvailable, input.quantityAvailable)
            : undefined,
          // Filter by stock value (numeric comparison)
          input.stockValue && input.stockValue.trim() !== ""
            ? gte(
                sql`CAST(${stockCurrent.quantityAvailable} AS NUMERIC) * CAST(${stockCurrent.averageCost} AS NUMERIC)`,
                input.stockValue
              )
            : undefined,
          // Filter by lastMovementDate date range
          input.lastMovementDate.length > 0
            ? and(
                input.lastMovementDate[0]
                  ? gte(
                      stockCurrent.lastMovementDate,
                      (() => {
                        const timestamp = input.lastMovementDate[0];
                        const date = new Date(timestamp);
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
                        const timestamp = input.lastMovementDate[1];
                        const date = new Date(timestamp);
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
                        const timestamp = input.lastUpdated[0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.lastUpdated[1]
                  ? lte(
                      stockCurrent.lastUpdated,
                      (() => {
                        const timestamp = input.lastUpdated[1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
          // Filter by low stock (quantityAvailable <= threshold)
          input.lowStock && input.lowStock.length > 0
            ? input.lowStock[0] === true
              ? lte(stockCurrent.quantityAvailable, "0")
              : gte(stockCurrent.quantityAvailable, "0.001")
            : undefined,
        );

    // Map sort IDs to actual columns
    const columnMap = {
      id: stockCurrent.id,
      productCode: product.code,
      productName: product.name,
      categoryName: category.name,
      quantityAvailable: stockCurrent.quantityAvailable,
      averageCost: stockCurrent.averageCost,
      lastMovementDate: stockCurrent.lastMovementDate,
      lastUpdated: stockCurrent.lastUpdated,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
            .map((item: { id: string; desc: boolean }) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(stockCurrent.lastUpdated)];

    const { data, total, summary } = await db.transaction(async (tx) => {
      // Get stock data with product and category info
      const data = await tx
        .select({
          stock: stockCurrent,
          product: {
            id: product.id,
            code: product.code,
            name: product.name,
            unitOfMeasure: product.unitOfMeasure,
          },
          category: {
            id: category.id,
            name: category.name,
          },
        })
        .from(stockCurrent)
        .leftJoin(product, eq(stockCurrent.productId, product.id))
        .leftJoin(category, eq(product.categoryId, category.id))
        .where(where)
        .limit(input.perPage)
        .offset(offset)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(stockCurrent)
        .leftJoin(product, eq(stockCurrent.productId, product.id))
        .leftJoin(category, eq(product.categoryId, category.id))
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      // Calculate summary statistics
      const summaryData = await tx
        .select({
          totalStockValue: sql<string>`COALESCE(SUM(CAST(${stockCurrent.quantityAvailable} AS NUMERIC) * CAST(${stockCurrent.averageCost} AS NUMERIC)), 0)`,
          totalProducts: count(),
          lowStockCount: sql<string>`COUNT(CASE WHEN CAST(${stockCurrent.quantityAvailable} AS NUMERIC) <= 0 THEN 1 END)`,
        })
        .from(stockCurrent)
        .leftJoin(product, eq(stockCurrent.productId, product.id))
        .where(where)
        .execute()
        .then((res) => res[0] ?? { totalStockValue: "0", totalProducts: 0, lowStockCount: "0" });

      return {
        data,
        total,
        summary: summaryData,
      };
    });

    return {
      stock: data.map((item) => {
        const quantityAvailable = parseFloat(item.stock.quantityAvailable);
        const averageCost = parseFloat(item.stock.averageCost || "0");
        const stockValue = quantityAvailable * averageCost;

        return {
          id: item.stock.id,
          productId: item.stock.productId,
          productCode: item.product?.code || null,
          productName: item.product?.name || null,
          categoryName: item.category?.name || null,
          unitOfMeasure: item.product?.unitOfMeasure || null,
          quantityAvailable,
          averageCost,
          stockValue,
          lastMovementDate: item.stock.lastMovementDate
            ? (typeof item.stock.lastMovementDate === 'string'
                ? new Date(item.stock.lastMovementDate + 'T00:00:00')
                : item.stock.lastMovementDate)
            : null,
          lastUpdated: item.stock.lastUpdated,
        };
      }),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
      summary: {
        totalStockValue: parseFloat(summary.totalStockValue.toString()),
        totalProducts: summary.totalProducts,
        lowStockCount: parseFloat(summary.lowStockCount.toString()),
      },
    };
  } catch (error) {
    console.error("Error getting stock current", error);
    return {
      stock: [],
      options: { totalCount: 0, limit: input.perPage, offset: (input.page - 1) * input.perPage },
      summary: {
        totalStockValue: 0,
        totalProducts: 0,
        lowStockCount: 0,
      },
    };
  }
};

export const getStockMovements = async (input: GetStockMovementsSchema): Promise<StockMovementDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: stockMovement,
      filters: input.filters as any,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
      ? advancedWhere
      : and(
          // Search by product name or code
          input.search
            ? or(
                ilike(product.name, `%${input.search}%`),
                ilike(product.code, `%${input.search}%`)
              )
            : undefined,
          // Filter by movement type
          input.movementType && input.movementType.length > 0
            ? inArray(stockMovement.movementType, input.movementType)
            : undefined,
          // Filter by movement source
          input.movementSource && input.movementSource.length > 0
            ? inArray(stockMovement.movementSource, input.movementSource)
            : undefined,
          // Filter by movementDate date range
          input.movementDate.length > 0
            ? and(
                input.movementDate[0]
                  ? gte(
                      stockMovement.movementDate,
                      (() => {
                        const timestamp = input.movementDate[0];
                        const date = new Date(timestamp);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
                input.movementDate[1]
                  ? lte(
                      stockMovement.movementDate,
                      (() => {
                        const timestamp = input.movementDate[1];
                        const date = new Date(timestamp);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      stockMovement.createdAt,
                      (() => {
                        const timestamp = input.createdAt[0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      stockMovement.createdAt,
                      (() => {
                        const timestamp = input.createdAt[1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })(),
                    )
                  : undefined,
              )
            : undefined,
        );

    // Map sort IDs to actual columns
    const columnMap = {
      id: stockMovement.id,
      productCode: product.code,
      productName: product.name,
      movementType: stockMovement.movementType,
      movementSource: stockMovement.movementSource,
      quantity: stockMovement.quantity,
      unitCost: stockMovement.unitCost,
      movementDate: stockMovement.movementDate,
      createdAt: stockMovement.createdAt,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
            .map((item: { id: string; desc: boolean }) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item): item is ReturnType<typeof desc> | ReturnType<typeof asc> => item !== null)
        : [desc(stockMovement.movementDate), desc(stockMovement.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select({
          movement: stockMovement,
          product: {
            id: product.id,
            code: product.code,
            name: product.name,
          },
          creator: {
            id: user.id,
            name: user.name,
          },
        })
        .from(stockMovement)
        .leftJoin(product, eq(stockMovement.productId, product.id))
        .leftJoin(user, eq(stockMovement.createdBy, user.id))
        .where(where)
        .limit(input.perPage)
        .offset(offset)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(stockMovement)
        .leftJoin(product, eq(stockMovement.productId, product.id))
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    return {
      movements: data.map((item) => {
        const quantity = parseFloat(item.movement.quantity);
        const unitCost = item.movement.unitCost ? parseFloat(item.movement.unitCost) : null;
        const totalCost = unitCost !== null ? quantity * unitCost : null;

        return {
          id: item.movement.id,
          productId: item.movement.productId,
          productCode: item.product?.code || null,
          productName: item.product?.name || null,
          movementType: item.movement.movementType,
          movementSource: item.movement.movementSource,
          referenceType: item.movement.referenceType,
          referenceId: item.movement.referenceId,
          quantity,
          unitCost,
          totalCost,
          movementDate: typeof item.movement.movementDate === 'string'
            ? new Date(item.movement.movementDate + 'T00:00:00')
            : item.movement.movementDate,
          notes: item.movement.notes,
          createdBy: item.movement.createdBy,
          createdByName: item.creator?.name || null,
          createdAt: item.movement.createdAt,
        };
      }),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting stock movements", error);
    return {
      movements: [],
      options: { totalCount: 0, limit: input.perPage, offset: (input.page - 1) * input.perPage },
    };
  }
};

export const getStockMovementById = async (id: string): Promise<StockMovementDTOItem | null> => {
  try {
    const result = await db
      .select({
        movement: stockMovement,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(stockMovement)
      .leftJoin(product, eq(stockMovement.productId, product.id))
      .leftJoin(user, eq(stockMovement.createdBy, user.id))
      .where(eq(stockMovement.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    const quantity = parseFloat(item.movement.quantity);
    const unitCost = item.movement.unitCost ? parseFloat(item.movement.unitCost) : null;
    const totalCost = unitCost !== null ? quantity * unitCost : null;

    return {
      id: item.movement.id,
      productId: item.movement.productId,
      productCode: item.product?.code || null,
      productName: item.product?.name || null,
      movementType: item.movement.movementType,
      movementSource: item.movement.movementSource,
      referenceType: item.movement.referenceType,
      referenceId: item.movement.referenceId,
      quantity,
      unitCost,
      totalCost,
      movementDate: typeof item.movement.movementDate === 'string'
        ? new Date(item.movement.movementDate + 'T00:00:00')
        : item.movement.movementDate,
      notes: item.movement.notes,
      createdBy: item.movement.createdBy,
      createdByName: item.creator?.name || null,
      createdAt: item.movement.createdAt,
    };
  } catch (error) {
    console.error("Error getting stock movement by ID", error);
    return null;
  }
};

