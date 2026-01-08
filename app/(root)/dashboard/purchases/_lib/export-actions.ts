"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetPurchaseOrdersSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { purchaseOrder, purchaseOrderItem, product, partner, user } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or, sql, ne, notInArray, lt, gt } from "drizzle-orm";

/**
 * Get purchase orders by IDs for export
 */
export async function getPurchaseOrdersByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const orders = await db
      .select({
        purchaseOrder: purchaseOrder,
        supplier: {
          id: partner.id,
          name: partner.name,
          address: partner.address,
          phone: partner.phone,
          email: partner.email,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(purchaseOrder)
      .leftJoin(partner, eq(purchaseOrder.supplierId, partner.id))
      .leftJoin(user, eq(purchaseOrder.createdBy, user.id))
      .where(inArray(purchaseOrder.id, input.ids))
      .orderBy(desc(purchaseOrder.orderDate), desc(purchaseOrder.createdAt));

    // Get items for each purchase order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            item: purchaseOrderItem,
            product: {
              id: product.id,
              name: product.name,
              code: product.code,
            },
          })
          .from(purchaseOrderItem)
          .leftJoin(product, eq(purchaseOrderItem.productId, product.id))
          .where(eq(purchaseOrderItem.purchaseOrderId, order.purchaseOrder.id))
          .orderBy(asc(purchaseOrderItem.id));

        const orderDate = typeof order.purchaseOrder.orderDate === 'string'
          ? new Date(order.purchaseOrder.orderDate + 'T00:00:00')
          : order.purchaseOrder.orderDate;
        const receptionDate = order.purchaseOrder.receptionDate
          ? (typeof order.purchaseOrder.receptionDate === 'string'
              ? new Date(order.purchaseOrder.receptionDate + 'T00:00:00')
              : order.purchaseOrder.receptionDate)
          : null;

        return {
          id: order.purchaseOrder.id,
          orderNumber: order.purchaseOrder.orderNumber,
          supplierId: order.purchaseOrder.supplierId,
          supplierName: order.supplier?.name || null,
          supplierAddress: order.supplier?.address || null,
          supplierPhone: order.supplier?.phone || null,
          supplierEmail: order.supplier?.email || null,
          orderDate,
          receptionDate,
          status: order.purchaseOrder.status || "pending",
          currency: order.purchaseOrder.currency || "DZD",
          totalAmount: order.purchaseOrder.totalAmount ? parseFloat(order.purchaseOrder.totalAmount) : 0,
          notes: order.purchaseOrder.notes,
          createdBy: order.purchaseOrder.createdBy,
          createdByName: order.creator?.name || null,
          createdAt: order.purchaseOrder.createdAt,
          items: items.map((i) => ({
            id: i.item.id,
            productId: i.item.productId,
            productName: i.product?.name || null,
            productCode: i.product?.code || null,
            quantity: parseFloat(i.item.quantity),
            unitCost: parseFloat(i.item.unitCost),
            taxRate: i.item.taxRate ? parseFloat(i.item.taxRate) : 0,
            lineTotal: parseFloat(i.item.lineTotal),
          })),
        };
      })
    );

    return {
      data: ordersWithItems,
      error: null,
    };
  } catch (err) {
    console.error("Error getting purchase orders by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered purchase orders for export based on table filters
 */
export async function getFilteredPurchaseOrdersForExport(input: GetPurchaseOrdersSchema) {
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
              case "orderNumber":
                column = purchaseOrder.orderNumber;
                break;
              case "supplierId":
                column = purchaseOrder.supplierId;
                break;
              case "status":
                column = purchaseOrder.status;
                break;
              case "orderDate":
                column = purchaseOrder.orderDate;
                break;
              case "createdAt":
                column = purchaseOrder.createdAt;
                break;
              default:
                return undefined;
            }

            const isTimestampType = filter.id === "createdAt";
            const isDateType = filter.id === "orderDate";

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
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    return eq(column, dateStr);
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
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    return ne(column, dateStr);
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
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    return lt(column, dateStr);
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
                if (isDateType) {
                  const date = new Date(Number(filter.value));
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  return lte(column, dateStr);
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
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    return gt(column, dateStr);
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
                if (isDateType) {
                  const date = new Date(Number(filter.value));
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  return gte(column, dateStr);
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
                  if (isDateType) {
                    return and(
                      filter.value[0]
                        ? gte(
                            column,
                            (() => {
                              const date = new Date(Number(filter.value[0]));
                              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            })(),
                          )
                        : undefined,
                      filter.value[1]
                        ? lte(
                            column,
                            (() => {
                              const date = new Date(Number(filter.value[1]));
                              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
          // Search by order number
          input.orderNumber
            ? ilike(purchaseOrder.orderNumber, `%${input.orderNumber}%`)
            : undefined,
          // Filter by supplier
          input.supplierId && input.supplierId.length > 0
            ? inArray(purchaseOrder.supplierId, input.supplierId)
            : undefined,
          // Filter by status
          input.status && input.status.length > 0
            ? inArray(
                purchaseOrder.status,
                input.status as ("pending" | "received" | "cancelled")[]
              )
            : undefined,
          // Filter by orderDate date range
          input.orderDate.length > 0
            ? and(
                input.orderDate[0]
                  ? gte(
                      purchaseOrder.orderDate,
                      (() => {
                        const date = new Date(input.orderDate[0]);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      })(),
                    )
                  : undefined,
                input.orderDate[1]
                  ? lte(
                      purchaseOrder.orderDate,
                      (() => {
                        const date = new Date(input.orderDate[1]);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
                      purchaseOrder.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      purchaseOrder.createdAt,
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
    
    // Get all purchase orders matching filters
    const orders = await db
      .select({
        purchaseOrder: purchaseOrder,
        supplier: {
          id: partner.id,
          name: partner.name,
          address: partner.address,
          phone: partner.phone,
          email: partner.email,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(purchaseOrder)
      .leftJoin(partner, eq(purchaseOrder.supplierId, partner.id))
      .leftJoin(user, eq(purchaseOrder.createdBy, user.id))
      .where(where)
      .orderBy(desc(purchaseOrder.orderDate), desc(purchaseOrder.createdAt));

    // Get items for each purchase order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            item: purchaseOrderItem,
            product: {
              id: product.id,
              name: product.name,
              code: product.code,
            },
          })
          .from(purchaseOrderItem)
          .leftJoin(product, eq(purchaseOrderItem.productId, product.id))
          .where(eq(purchaseOrderItem.purchaseOrderId, order.purchaseOrder.id))
          .orderBy(asc(purchaseOrderItem.id));

        const orderDate = typeof order.purchaseOrder.orderDate === 'string'
          ? new Date(order.purchaseOrder.orderDate + 'T00:00:00')
          : order.purchaseOrder.orderDate;
        const receptionDate = order.purchaseOrder.receptionDate
          ? (typeof order.purchaseOrder.receptionDate === 'string'
              ? new Date(order.purchaseOrder.receptionDate + 'T00:00:00')
              : order.purchaseOrder.receptionDate)
          : null;

        return {
          id: order.purchaseOrder.id,
          orderNumber: order.purchaseOrder.orderNumber,
          supplierId: order.purchaseOrder.supplierId,
          supplierName: order.supplier?.name || null,
          supplierAddress: order.supplier?.address || null,
          supplierPhone: order.supplier?.phone || null,
          supplierEmail: order.supplier?.email || null,
          orderDate,
          receptionDate,
          status: order.purchaseOrder.status || "pending",
          currency: order.purchaseOrder.currency || "DZD",
          totalAmount: order.purchaseOrder.totalAmount ? parseFloat(order.purchaseOrder.totalAmount) : 0,
          notes: order.purchaseOrder.notes,
          createdBy: order.purchaseOrder.createdBy,
          createdByName: order.creator?.name || null,
          createdAt: order.purchaseOrder.createdAt,
          items: items.map((i) => ({
            id: i.item.id,
            productId: i.item.productId,
            productName: i.product?.name || null,
            productCode: i.product?.code || null,
            quantity: parseFloat(i.item.quantity),
            unitCost: parseFloat(i.item.unitCost),
            taxRate: i.item.taxRate ? parseFloat(i.item.taxRate) : 0,
            lineTotal: parseFloat(i.item.lineTotal),
          })),
        };
      })
    );
    
    return {
      data: ordersWithItems,
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered purchase orders for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

