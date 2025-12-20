import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import db from "@/db";
import { purchaseOrder, purchaseOrderItem, partner, user, product, invoice } from "@/db/schema";
import type { GetPurchaseOrdersSchema } from "@/app/(root)/dashboard/purchases/_lib/validation";
import type { PurchaseOrderDTO } from "./purchase-order.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

export const getPurchaseOrders = async (input: GetPurchaseOrdersSchema): Promise<PurchaseOrderDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: purchaseOrder,
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

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
          // orderDate is a PostgreSQL date type, so we compare with date strings (YYYY-MM-DD)
          input.orderDate.length > 0
            ? and(
                input.orderDate[0]
                  ? gte(
                      purchaseOrder.orderDate,
                      (() => {
                        // Convert timestamp to date string YYYY-MM-DD
                        const date = new Date(input.orderDate[0]);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                    )
                  : undefined,
                input.orderDate[1]
                  ? lte(
                      purchaseOrder.orderDate,
                      (() => {
                        // Convert timestamp to date string YYYY-MM-DD
                        const date = new Date(input.orderDate[1]);
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

    // Map sort IDs to actual purchaseOrder table columns
    const columnMap = {
      id: purchaseOrder.id,
      orderNumber: purchaseOrder.orderNumber,
      supplierId: purchaseOrder.supplierId,
      orderDate: purchaseOrder.orderDate,
      receptionDate: purchaseOrder.receptionDate,
      status: purchaseOrder.status,
      totalAmount: purchaseOrder.totalAmount,
      notes: purchaseOrder.notes,
      createdBy: purchaseOrder.createdBy,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
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
        : [desc(purchaseOrder.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select({
          purchaseOrder: purchaseOrder,
          supplier: {
            id: partner.id,
            name: partner.name,
          },
          creator: {
            id: user.id,
            name: user.name,
          },
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
          },
        })
        .from(purchaseOrder)
        .leftJoin(partner, eq(purchaseOrder.supplierId, partner.id))
        .leftJoin(user, eq(purchaseOrder.createdBy, user.id))
        .leftJoin(invoice, eq(purchaseOrder.id, invoice.purchaseOrderId))
        .limit(input.perPage)
        .offset(offset)
        .where(where)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(purchaseOrder)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    return {
      purchaseOrders: data.map((item) => {
        // PostgreSQL date columns return as strings, convert to Date objects
        const orderDate = typeof item.purchaseOrder.orderDate === 'string'
          ? new Date(item.purchaseOrder.orderDate + 'T00:00:00')
          : item.purchaseOrder.orderDate;
        const receptionDate = item.purchaseOrder.receptionDate
          ? (typeof item.purchaseOrder.receptionDate === 'string'
              ? new Date(item.purchaseOrder.receptionDate + 'T00:00:00')
              : item.purchaseOrder.receptionDate)
          : null;

        return {
          id: item.purchaseOrder.id,
          orderNumber: item.purchaseOrder.orderNumber,
          supplierId: item.purchaseOrder.supplierId,
          supplierName: item.supplier?.name || null,
          orderDate,
          receptionDate,
          status: item.purchaseOrder.status || "pending",
          totalAmount: item.purchaseOrder.totalAmount,
          notes: item.purchaseOrder.notes,
          createdBy: item.purchaseOrder.createdBy,
          createdByName: item.creator?.name || null,
          createdAt: item.purchaseOrder.createdAt,
          updatedAt: item.purchaseOrder.updatedAt,
          invoiceId: item.invoice?.id || null,
          invoiceNumber: item.invoice?.invoiceNumber || null,
        };
      }),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting purchase orders", error);
    return {
      purchaseOrders: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: 0,
      },
    };
  }
};

export const getPurchaseOrderById = async (id: string) => {
  try {
    const result = await db
      .select({
        purchaseOrder: purchaseOrder,
        supplier: {
          id: partner.id,
          name: partner.name,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(purchaseOrder)
      .leftJoin(partner, eq(purchaseOrder.supplierId, partner.id))
      .leftJoin(user, eq(purchaseOrder.createdBy, user.id))
      .where(eq(purchaseOrder.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    
    // Fetch purchase order items
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
      .where(eq(purchaseOrderItem.purchaseOrderId, id))
      .orderBy(asc(purchaseOrderItem.id));

    // PostgreSQL date columns return as strings, convert to Date objects
    const orderDate = typeof item.purchaseOrder.orderDate === 'string'
      ? new Date(item.purchaseOrder.orderDate + 'T00:00:00')
      : item.purchaseOrder.orderDate;
    const receptionDate = item.purchaseOrder.receptionDate
      ? (typeof item.purchaseOrder.receptionDate === 'string'
          ? new Date(item.purchaseOrder.receptionDate + 'T00:00:00')
          : item.purchaseOrder.receptionDate)
      : null;

    return {
      id: item.purchaseOrder.id,
      orderNumber: item.purchaseOrder.orderNumber,
      supplierId: item.purchaseOrder.supplierId,
      supplierName: item.supplier?.name || null,
      orderDate,
      receptionDate,
      status: item.purchaseOrder.status || "pending",
      supplierOrderNumber: item.purchaseOrder.supplierOrderNumber || null,
      totalAmount: item.purchaseOrder.totalAmount,
      notes: item.purchaseOrder.notes,
      createdBy: item.purchaseOrder.createdBy,
      createdByName: item.creator?.name || null,
      createdAt: item.purchaseOrder.createdAt,
      updatedAt: item.purchaseOrder.updatedAt,
      items: items.map((i) => ({
        id: i.item.id,
        productId: i.item.productId,
        productName: i.product?.name || null,
        productCode: i.product?.code || null,
        quantity: parseFloat(i.item.quantity),
        unitCost: parseFloat(i.item.unitCost),
        lineTotal: parseFloat(i.item.lineTotal),
      })),
    };
  } catch (error) {
    console.error("Error getting purchase order by ID", error);
    return null;
  }
};

