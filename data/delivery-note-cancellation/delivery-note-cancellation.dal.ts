import "server-only";
import { and, asc, desc, eq, gte, gt, ilike, inArray, lte, lt, ne, or, sql } from "drizzle-orm";
import db from "@/db";
import { 
  deliveryNoteCancellation, 
  deliveryNote, 
  deliveryNoteItem,
  deliveryNoteCancellationItem,
  product,
  partner,
  user 
} from "@/db/schema";
import type { DeliveryNoteCancellationDTO } from "./delivery-note-cancellation.dto";
import type { ClientDeliveryNoteItemDTO } from "./delivery-note-cancellation-item.dto";

type GetDeliveryNoteCancellationsSchema = {
  page: number;
  perPage: number;
  sort: Array<{ id: string; desc: boolean }>;
  filters?: any;
  filterFlag?: "filters" | "advancedFilters" | "commandFilters";
  joinOperator?: "and" | "or";
  search?: string;
  cancellationNumber?: string;
  clientId?: string[];
  cancellationDate?: number[];
  createdAt?: number[];
};

export const getDeliveryNoteCancellations = async (
  input: GetDeliveryNoteCancellationsSchema
): Promise<DeliveryNoteCancellationDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    // Custom filter handling for date columns (cancellationDate is a date type, not timestamp)
    const advancedWhere = input.filters && input.filters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = input.filters.map((filter: any) => {
            if (!filter.operator) return undefined;
            
            // Get the column
            let column: any;
            switch (filter.id) {
              case "id":
                column = deliveryNoteCancellation.id;
                break;
              case "cancellationNumber":
                column = deliveryNoteCancellation.cancellationNumber;
                break;
              case "clientId":
                column = deliveryNoteCancellation.clientId;
                break;
              case "cancellationDate":
                column = deliveryNoteCancellation.cancellationDate;
                break;
              case "createdAt":
                column = deliveryNoteCancellation.createdAt;
                break;
              default:
                return undefined;
            }

            // Handle date columns specially (cancellationDate is a date type, not timestamp)
            const isDateType = filter.id === "cancellationDate";
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
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    // For date columns, use string format YYYY-MM-DD
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return eq(column, dateStr);
                  } else if (isTimestampType) {
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
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const dateStr = date.toISOString().split("T")[0];
                    return lt(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return lt(column, date);
                  }
                }
                return lt(column, filter.value);

              case "lte":
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(23, 59, 59, 999);
                    const dateStr = date.toISOString().split("T")[0];
                    return lte(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(23, 59, 59, 999);
                    return lte(column, date);
                  }
                }
                return lte(column, filter.value);

              case "gt":
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const dateStr = date.toISOString().split("T")[0];
                    return gt(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return gt(column, date);
                  }
                }
                return gt(column, filter.value);

              case "gte":
                if (filter.variant === "date" || filter.variant === "dateRange") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    const dateStr = date.toISOString().split("T")[0];
                    return gte(column, dateStr);
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return gte(column, date);
                  }
                }
                return gte(column, filter.value);

              case "between":
                if (filter.variant === "dateRange" && Array.isArray(filter.value) && filter.value.length === 2) {
                  if (isDateType) {
                    const start = new Date(Number(filter.value[0]));
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(Number(filter.value[1]));
                    end.setHours(23, 59, 59, 999);
                    return and(
                      gte(column, start.toISOString().split("T")[0]),
                      lte(column, end.toISOString().split("T")[0])
                    );
                  } else if (isTimestampType) {
                    const start = new Date(Number(filter.value[0]));
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(Number(filter.value[1]));
                    end.setHours(23, 59, 59, 999);
                    return and(gte(column, start), lte(column, end));
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
                  return sql`${column} NOT IN (${sql.join(filter.value.map((v: string | number) => sql`${v}`), sql`, `)})`;
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
      ? and(
          advancedWhere || undefined,
          // Also apply basic search if provided
          input.search
            ? or(
                ilike(deliveryNoteCancellation.cancellationNumber, `%${input.search}%`),
                sql`EXISTS (SELECT 1 FROM ${partner} WHERE ${partner.id} = ${deliveryNoteCancellation.clientId} AND ${partner.name} ILIKE ${`%${input.search}%`})`
              )
            : undefined,
          input.cancellationNumber
            ? ilike(deliveryNoteCancellation.cancellationNumber, `%${input.cancellationNumber}%`)
            : undefined,
          // Filter by clientId (from toolbar)
          input.clientId && input.clientId.length > 0
            ? inArray(deliveryNoteCancellation.clientId, input.clientId)
            : undefined,
          // Filter by cancellationDate date range (for basic toolbar)
          input.cancellationDate && input.cancellationDate.length === 2
            ? and(
                input.cancellationDate[0]
                  ? gte(
                      deliveryNoteCancellation.cancellationDate,
                      (() => {
                        const timestamp = input.cancellationDate![0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date.toISOString().split("T")[0];
                      })()
                    )
                  : undefined,
                input.cancellationDate[1]
                  ? lte(
                      deliveryNoteCancellation.cancellationDate,
                      (() => {
                        const timestamp = input.cancellationDate![1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date.toISOString().split("T")[0];
                      })()
                    )
                  : undefined
              )
            : undefined,
          // Filter by createdAt date range (for basic toolbar)
          input.createdAt && input.createdAt.length === 2
            ? and(
                input.createdAt[0]
                  ? gte(
                      deliveryNoteCancellation.createdAt,
                      (() => {
                        const timestamp = input.createdAt![0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })()
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      deliveryNoteCancellation.createdAt,
                      (() => {
                        const timestamp = input.createdAt![1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })()
                    )
                  : undefined
              )
            : undefined
        )
      : and(
          // Search by cancellation number or client name
          input.search
            ? or(
                ilike(deliveryNoteCancellation.cancellationNumber, `%${input.search}%`),
                sql`EXISTS (SELECT 1 FROM ${partner} WHERE ${partner.id} = ${deliveryNoteCancellation.clientId} AND ${partner.name} ILIKE ${`%${input.search}%`})`
              )
            : undefined,
          // Filter by cancellation number (from toolbar)
          input.cancellationNumber
            ? ilike(deliveryNoteCancellation.cancellationNumber, `%${input.cancellationNumber}%`)
            : undefined,
          // Filter by clientId (from toolbar)
          input.clientId && input.clientId.length > 0
            ? inArray(deliveryNoteCancellation.clientId, input.clientId)
            : undefined,
          // Filter by cancellationDate date range
          input.cancellationDate && input.cancellationDate.length === 2
            ? and(
                input.cancellationDate[0]
                  ? gte(
                      deliveryNoteCancellation.cancellationDate,
                      (() => {
                        const timestamp = input.cancellationDate![0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date.toISOString().split("T")[0];
                      })()
                    )
                  : undefined,
                input.cancellationDate[1]
                  ? lte(
                      deliveryNoteCancellation.cancellationDate,
                      (() => {
                        const timestamp = input.cancellationDate![1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date.toISOString().split("T")[0];
                      })()
                    )
                  : undefined
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt && input.createdAt.length === 2
            ? and(
                input.createdAt[0]
                  ? gte(
                      deliveryNoteCancellation.createdAt,
                      (() => {
                        const timestamp = input.createdAt![0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })()
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      deliveryNoteCancellation.createdAt,
                      (() => {
                        const timestamp = input.createdAt![1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })()
                    )
                  : undefined
              )
            : undefined
        ) || undefined;

    // Map sort IDs to actual columns
    const columnMap = {
      id: deliveryNoteCancellation.id,
      cancellationNumber: deliveryNoteCancellation.cancellationNumber,
      clientId: deliveryNoteCancellation.clientId,
      cancellationDate: deliveryNoteCancellation.cancellationDate,
      createdAt: deliveryNoteCancellation.createdAt,
    } as const;

    const orderBy =
      input.sort.length > 0
        ? input.sort
            .map((item: { id: string; desc: boolean }) => {
              const column = columnMap[item.id as keyof typeof columnMap];
              if (!column) return null;
              return item.desc ? desc(column) : asc(column);
            })
            .filter((item) => item !== null)
        : [desc(deliveryNoteCancellation.cancellationDate)];

    // Get data with joins
    // Use COALESCE to get note number from either originalDeliveryNoteId or from cancellation items
    const query = db
      .select({
        cancellation: deliveryNoteCancellation,
        client: {
          id: partner.id,
          name: partner.name,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
        originalDeliveryNote: {
          id: deliveryNote.id,
          noteNumber: deliveryNote.noteNumber,
        },
        // Combined note number: use originalDeliveryNote if available, otherwise get from cancellation items
        combinedNoteNumber: sql<string | null>`
          COALESCE(
            ${deliveryNote.noteNumber},
            (
              SELECT dn.note_number
              FROM ${deliveryNoteCancellationItem}
              INNER JOIN ${deliveryNoteItem} ON ${deliveryNoteCancellationItem.deliveryNoteItemId} = ${deliveryNoteItem.id}
              INNER JOIN ${deliveryNote} AS dn ON ${deliveryNoteItem.deliveryNoteId} = dn.id
              WHERE ${deliveryNoteCancellationItem.deliveryNoteCancellationId} = ${deliveryNoteCancellation.id}
              LIMIT 1
            )
          )
        `.as("combinedNoteNumber"),
      })
      .from(deliveryNoteCancellation)
      .leftJoin(
        partner,
        eq(deliveryNoteCancellation.clientId, partner.id)
      )
      .leftJoin(user, eq(deliveryNoteCancellation.createdBy, user.id))
      .leftJoin(
        deliveryNote,
        eq(deliveryNoteCancellation.originalDeliveryNoteId, deliveryNote.id)
      )
      .where(where)
      .orderBy(...orderBy)
      .limit(input.perPage)
      .offset(offset);

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(deliveryNoteCancellation)
      .leftJoin(
        partner,
        eq(deliveryNoteCancellation.clientId, partner.id)
      )
      .where(where);

    const [data, countResult] = await Promise.all([query, countQuery]);
    const total = Number(countResult[0]?.count || 0);

    return {
      cancellations: data.map((item) => {
        // Use combinedNoteNumber from COALESCE query (originalDeliveryNote or from items)
        const noteNumber = item.combinedNoteNumber ? String(item.combinedNoteNumber) : null;
        
        return {
          id: item.cancellation.id,
          cancellationNumber: item.cancellation.cancellationNumber,
          originalDeliveryNoteId: item.cancellation.originalDeliveryNoteId,
          originalDeliveryNoteNumber: noteNumber,
          clientId: item.cancellation.clientId,
          clientName: item.client?.name || null,
          cancellationDate:
            typeof item.cancellation.cancellationDate === "string"
              ? new Date(item.cancellation.cancellationDate + "T00:00:00")
              : item.cancellation.cancellationDate,
          reason: item.cancellation.reason,
          createdBy: item.cancellation.createdBy,
          createdByName: item.creator?.name || null,
          createdAt: item.cancellation.createdAt,
        };
      }),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting delivery note cancellations", error);
    return {
      cancellations: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: (input.page - 1) * input.perPage,
      },
    };
  }
};

/**
 * Get all delivery note items for a specific client that can be cancelled
 * Returns items with their original quantities and already cancelled quantities
 */
export const getClientDeliveryNoteItems = async (
  clientId: string
): Promise<ClientDeliveryNoteItemDTO[]> => {
  try {
    // Get all delivery note items for this client from active delivery notes
    const items = await db
      .select({
        deliveryNoteItem: deliveryNoteItem,
        deliveryNote: {
          id: deliveryNote.id,
          noteNumber: deliveryNote.noteNumber,
          noteDate: deliveryNote.noteDate,
          status: deliveryNote.status,
        },
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
        },
      })
      .from(deliveryNoteItem)
      .innerJoin(deliveryNote, eq(deliveryNoteItem.deliveryNoteId, deliveryNote.id))
      .leftJoin(product, eq(deliveryNoteItem.productId, product.id))
      .where(
        and(
          eq(deliveryNote.clientId, clientId),
          eq(deliveryNote.status, "active")
        )
      )
      .orderBy(desc(deliveryNote.noteDate), desc(deliveryNoteItem.id));

    // Get already cancelled quantities for each item
    const itemIds = items.map((item) => item.deliveryNoteItem.id);
    
    const cancelledQuantities = itemIds.length > 0
      ? await db
          .select({
            deliveryNoteItemId: deliveryNoteCancellationItem.deliveryNoteItemId,
            cancelledQuantity: sql<number>`COALESCE(SUM(${deliveryNoteCancellationItem.quantity}::numeric), 0)`,
          })
          .from(deliveryNoteCancellationItem)
          .where(inArray(deliveryNoteCancellationItem.deliveryNoteItemId, itemIds))
          .groupBy(deliveryNoteCancellationItem.deliveryNoteItemId)
      : [];

    const cancelledMap = new Map(
      cancelledQuantities.map((c) => [
        c.deliveryNoteItemId,
        parseFloat(c.cancelledQuantity.toString()),
      ])
    );

    // Map to DTO format
    return items.map((item) => {
      const originalQuantity = parseFloat(item.deliveryNoteItem.quantity);
      const cancelledQuantity = cancelledMap.get(item.deliveryNoteItem.id) || 0;
      const availableQuantity = originalQuantity - cancelledQuantity;

      return {
        deliveryNoteItemId: item.deliveryNoteItem.id,
        deliveryNoteId: item.deliveryNoteItem.deliveryNoteId,
        noteNumber: item.deliveryNote.noteNumber,
        noteDate:
          typeof item.deliveryNote.noteDate === "string"
            ? new Date(item.deliveryNote.noteDate + "T00:00:00")
            : item.deliveryNote.noteDate,
        productId: item.deliveryNoteItem.productId,
        productName: item.product?.name || null,
        productCode: item.product?.code || null,
        originalQuantity,
        cancelledQuantity,
        availableQuantity,
        unitPrice: parseFloat(item.deliveryNoteItem.unitPrice),
        discountPercent: parseFloat(item.deliveryNoteItem.discountPercent || "0"),
        lineTotal: parseFloat(item.deliveryNoteItem.lineTotal),
      };
    });
  } catch (error) {
    console.error("Error getting client delivery note items", error);
    return [];
  }
};

/**
 * Get a delivery note cancellation by ID with its items
 */
export const getDeliveryNoteCancellationById = async (id: string) => {
  try {
    const cancellation = await db
      .select({
        cancellation: deliveryNoteCancellation,
        client: {
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
        originalDeliveryNote: {
          id: deliveryNote.id,
          noteNumber: deliveryNote.noteNumber,
        },
      })
      .from(deliveryNoteCancellation)
      .leftJoin(partner, eq(deliveryNoteCancellation.clientId, partner.id))
      .leftJoin(user, eq(deliveryNoteCancellation.createdBy, user.id))
      .leftJoin(
        deliveryNote,
        eq(deliveryNoteCancellation.originalDeliveryNoteId, deliveryNote.id)
      )
      .where(eq(deliveryNoteCancellation.id, id))
      .limit(1);

    if (cancellation.length === 0) {
      return null;
    }

    const cancellationData = cancellation[0];

    // Get cancellation items with delivery note item details
    const cancellationItems = await db
      .select({
        cancellationItem: deliveryNoteCancellationItem,
        deliveryNoteItem: {
          id: deliveryNoteItem.id,
          deliveryNoteId: deliveryNoteItem.deliveryNoteId,
          productId: deliveryNoteItem.productId,
          quantity: deliveryNoteItem.quantity,
          unitPrice: deliveryNoteItem.unitPrice,
          discountPercent: deliveryNoteItem.discountPercent,
          lineTotal: deliveryNoteItem.lineTotal,
        },
        deliveryNote: {
          id: deliveryNote.id,
          noteNumber: deliveryNote.noteNumber,
          noteDate: deliveryNote.noteDate,
          noteType: deliveryNote.noteType,
        },
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
          taxRate: product.taxRate,
        },
      })
      .from(deliveryNoteCancellationItem)
      .innerJoin(
        deliveryNoteItem,
        eq(deliveryNoteCancellationItem.deliveryNoteItemId, deliveryNoteItem.id)
      )
      .innerJoin(
        deliveryNote,
        eq(deliveryNoteItem.deliveryNoteId, deliveryNote.id)
      )
      .leftJoin(product, eq(deliveryNoteItem.productId, product.id))
      .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, id));

    return {
      id: cancellationData.cancellation.id,
      cancellationNumber: cancellationData.cancellation.cancellationNumber,
      originalDeliveryNoteId: cancellationData.cancellation.originalDeliveryNoteId,
      originalDeliveryNoteNumber: cancellationData.originalDeliveryNote?.noteNumber || null,
      clientId: cancellationData.cancellation.clientId,
      cancellationDate:
        typeof cancellationData.cancellation.cancellationDate === "string"
          ? new Date(cancellationData.cancellation.cancellationDate + "T00:00:00")
          : cancellationData.cancellation.cancellationDate,
      reason: cancellationData.cancellation.reason,
      createdBy: cancellationData.cancellation.createdBy,
      createdByName: cancellationData.creator?.name || null,
      createdAt: cancellationData.cancellation.createdAt,
      client: cancellationData.client && cancellationData.client.id
        ? {
            id: cancellationData.client.id,
            name: cancellationData.client.name,
            address: (cancellationData.client as any).address ?? null,
            phone: (cancellationData.client as any).phone ?? null,
            email: (cancellationData.client as any).email ?? null,
          }
        : null,
      items: cancellationItems.map((item) => ({
        id: item.cancellationItem.id,
        deliveryNoteItemId: item.cancellationItem.deliveryNoteItemId,
        deliveryNoteId: item.deliveryNoteItem.deliveryNoteId,
        productId: item.deliveryNoteItem.productId,
        productName: item.product?.name || null,
        productCode: item.product?.code || null,
        productTaxRate: item.product?.taxRate ? parseFloat(item.product.taxRate) : 0,
        noteNumber: item.deliveryNote.noteNumber,
        noteDate:
          typeof item.deliveryNote.noteDate === "string"
            ? new Date(item.deliveryNote.noteDate + "T00:00:00")
            : item.deliveryNote.noteDate,
        noteType: item.deliveryNote.noteType as "local" | "export",
        originalQuantity: parseFloat(item.deliveryNoteItem.quantity),
        cancelledQuantity: parseFloat(item.cancellationItem.quantity),
        unitPrice: parseFloat(item.cancellationItem.unitPrice),
        discountPercent: parseFloat(item.cancellationItem.discountPercent || "0"),
        lineTotal: parseFloat(item.cancellationItem.lineTotal),
      })),
    };
  } catch (error) {
    console.error("Error getting delivery note cancellation by ID", error);
    return null;
  }
};

