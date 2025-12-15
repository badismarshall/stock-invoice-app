import "server-only";
import { and, asc, desc, eq, gte, gt, ilike, inArray, lte, lt, ne, notInArray, or, sql } from "drizzle-orm";
import db from "@/db";
import { deliveryNote, deliveryNoteItem, partner, product, user } from "@/db/schema";
import type { DeliveryNoteDTO } from "./delivery-note.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

type GetDeliveryNotesSchema = {
  page: number;
  perPage: number;
  sort: Array<{ id: string; desc: boolean }>;
  filters?: any;
  filterFlag?: "filters" | "advancedFilters" | "commandFilters";
  joinOperator?: "and" | "or";
  search?: string;
  noteNumber?: string;
  noteType?: string[];
  status?: string[];
  clientId?: string[];
  noteDate?: number[];
  createdAt?: number[];
};

export const getDeliveryNotes = async (
  input: GetDeliveryNotesSchema
): Promise<DeliveryNoteDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    // Custom filter handling for date columns (noteDate is a date type, not timestamp)
    const advancedWhere = input.filters && input.filters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = input.filters.map((filter: any) => {
            if (!filter.operator) return undefined;
            
            // Get the column
            let column: any;
            switch (filter.id) {
              case "id":
                column = deliveryNote.id;
                break;
              case "noteNumber":
                column = deliveryNote.noteNumber;
                break;
              case "clientId":
                column = deliveryNote.clientId;
                break;
              case "noteType":
                column = deliveryNote.noteType;
                break;
              case "noteDate":
                column = deliveryNote.noteDate;
                break;
              case "status":
                column = deliveryNote.status;
                break;
              case "createdAt":
                column = deliveryNote.createdAt;
                break;
              default:
                return undefined;
            }

            // Handle date columns specially (noteDate is a date type, not timestamp)
            const isDateType = filter.id === "noteDate";
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
                return filter.variant === "number" || filter.variant === "range"
                  ? lt(column, filter.value)
                  : undefined;

              case "lte":
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
                return filter.variant === "number" || filter.variant === "range"
                  ? lte(column, filter.value)
                  : undefined;

              case "gt":
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
                return filter.variant === "number" || filter.variant === "range"
                  ? gt(column, filter.value)
                  : undefined;

              case "gte":
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
                return filter.variant === "number" || filter.variant === "range"
                  ? gte(column, filter.value)
                  : undefined;

              case "isBetween":
                if (
                  (filter.variant === "date" || filter.variant === "dateRange") &&
                  Array.isArray(filter.value) &&
                  filter.value.length === 2
                ) {
                  if (isDateType) {
                    const startDate = filter.value[0]
                      ? (() => {
                          const date = new Date(Number(filter.value[0]));
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()
                      : null;
                    const endDate = filter.value[1]
                      ? (() => {
                          const date = new Date(Number(filter.value[1]));
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()
                      : null;
                    return and(
                      startDate ? gte(column, startDate) : undefined,
                      endDate ? lte(column, endDate) : undefined,
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
                  return notInArray(column, filter.value);
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

    // Always filter by noteType if provided (for both basic and advanced filtering)
    const noteTypeFilter = input.noteType && input.noteType.length > 0
      ? inArray(deliveryNote.noteType, input.noteType as ("local" | "export")[])
      : undefined;

    // Build where clause
    const where = advancedTable
      ? and(
          advancedWhere || undefined,
          noteTypeFilter
        )
      : and(
          // Search by note number or client name (for backward compatibility)
          input.search
            ? or(
                ilike(deliveryNote.noteNumber, `%${input.search}%`),
                sql`EXISTS (
                  SELECT 1 FROM ${partner} 
                  WHERE ${partner.id} = ${deliveryNote.clientId} 
                  AND ${partner.name} ILIKE ${`%${input.search}%`}
                )`
              )
            : undefined,
          // Filter by note number (from toolbar)
          input.noteNumber
            ? ilike(deliveryNote.noteNumber, `%${input.noteNumber}%`)
            : undefined,
          // Filter by note type
          input.noteType && input.noteType.length > 0
            ? inArray(deliveryNote.noteType, input.noteType as ("local" | "export")[])
            : undefined,
          // Filter by status
          input.status && input.status.length > 0
            ? inArray(deliveryNote.status, input.status as ("active" | "cancelled")[])
            : undefined,
          // Filter by client
          input.clientId && input.clientId.length > 0
            ? inArray(deliveryNote.clientId, input.clientId)
            : undefined,
          // Filter by noteDate date range
          input.noteDate && input.noteDate.length > 0
            ? and(
                input.noteDate[0]
                  ? gte(
                      deliveryNote.noteDate,
                      (() => {
                        const timestamp = input.noteDate[0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date.toISOString().split("T")[0];
                      })()
                    )
                  : undefined,
                input.noteDate[1]
                  ? lte(
                      deliveryNote.noteDate,
                      (() => {
                        const timestamp = input.noteDate[1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date.toISOString().split("T")[0];
                      })()
                    )
                  : undefined
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt && input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      deliveryNote.createdAt,
                      (() => {
                        const timestamp = input.createdAt[0];
                        const date = new Date(timestamp);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })()
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      deliveryNote.createdAt,
                      (() => {
                        const timestamp = input.createdAt[1];
                        const date = new Date(timestamp);
                        date.setHours(23, 59, 59, 999);
                        return date;
                      })()
                    )
                  : undefined
              )
            : undefined
        );

    // Map sort IDs to actual columns
    const columnMap = {
      id: deliveryNote.id,
      noteNumber: deliveryNote.noteNumber,
      clientId: deliveryNote.clientId,
      noteType: deliveryNote.noteType,
      noteDate: deliveryNote.noteDate,
      status: deliveryNote.status,
      createdAt: deliveryNote.createdAt,
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
        : [desc(deliveryNote.noteDate), desc(deliveryNote.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      const query = tx
        .select({
          deliveryNote: deliveryNote,
          client: {
            id: partner.id,
            name: partner.name,
          },
          creator: {
            id: user.id,
            name: user.name,
          },
        })
        .from(deliveryNote)
        .leftJoin(partner, eq(deliveryNote.clientId, partner.id))
        .leftJoin(user, eq(deliveryNote.createdBy, user.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(input.perPage)
        .offset(offset);

      const countQuery = tx
        .select({ count: sql<number>`count(*)` })
        .from(deliveryNote)
        .where(where);

      const [data, countResult] = await Promise.all([query, countQuery]);
      const total = Number(countResult[0]?.count || 0);

      return { data, total };
    });

    // Calculate total amount for each delivery note from items
    const deliveryNotesWithTotals = await Promise.all(
      data.map(async (item) => {
        const items = await db
          .select({
            lineTotal: deliveryNoteItem.lineTotal,
          })
          .from(deliveryNoteItem)
          .where(eq(deliveryNoteItem.deliveryNoteId, item.deliveryNote.id));

        const totalAmount = items.reduce(
          (sum, item) => sum + parseFloat(item.lineTotal),
          0
        );

        return {
          ...item,
          totalAmount,
        };
      })
    );

    return {
      deliveryNotes: deliveryNotesWithTotals.map((item) => ({
        id: item.deliveryNote.id,
        noteNumber: item.deliveryNote.noteNumber,
        noteType: item.deliveryNote.noteType,
        clientId: item.deliveryNote.clientId,
        clientName: item.client?.name || null,
        noteDate:
          typeof item.deliveryNote.noteDate === "string"
            ? new Date(item.deliveryNote.noteDate + "T00:00:00")
            : item.deliveryNote.noteDate,
        status: item.deliveryNote.status || "active",
        currency: item.deliveryNote.currency,
        destinationCountry: item.deliveryNote.destinationCountry,
        deliveryLocation: item.deliveryNote.deliveryLocation,
        notes: item.deliveryNote.notes,
        createdBy: item.deliveryNote.createdBy,
        createdByName: item.creator?.name || null,
        createdAt: item.deliveryNote.createdAt,
        updatedAt: item.deliveryNote.updatedAt,
        totalAmount: item.totalAmount,
      })),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting delivery notes", error);
    return {
      deliveryNotes: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: (input.page - 1) * input.perPage,
      },
    };
  }
};

export const getDeliveryNoteById = async (id: string) => {
  try {
    const result = await db
      .select({
        deliveryNote: deliveryNote,
        client: {
          id: partner.id,
          name: partner.name,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(deliveryNote)
      .leftJoin(partner, eq(deliveryNote.clientId, partner.id))
      .leftJoin(user, eq(deliveryNote.createdBy, user.id))
      .where(eq(deliveryNote.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0];

    // Get items
    const items = await db
      .select({
        item: deliveryNoteItem,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
        },
      })
      .from(deliveryNoteItem)
      .leftJoin(product, eq(deliveryNoteItem.productId, product.id))
      .where(eq(deliveryNoteItem.deliveryNoteId, id));

    return {
      id: item.deliveryNote.id,
      noteNumber: item.deliveryNote.noteNumber,
      noteType: item.deliveryNote.noteType,
      clientId: item.deliveryNote.clientId,
      clientName: item.client?.name || null,
      noteDate:
        typeof item.deliveryNote.noteDate === "string"
          ? new Date(item.deliveryNote.noteDate + "T00:00:00")
          : item.deliveryNote.noteDate,
      status: item.deliveryNote.status,
      currency: item.deliveryNote.currency,
      destinationCountry: item.deliveryNote.destinationCountry,
      deliveryLocation: item.deliveryNote.deliveryLocation,
      notes: item.deliveryNote.notes,
      createdBy: item.deliveryNote.createdBy,
      createdByName: item.creator?.name || null,
      createdAt: item.deliveryNote.createdAt,
      updatedAt: item.deliveryNote.updatedAt,
      items: items.map((i) => ({
        id: i.item.id,
        deliveryNoteId: i.item.deliveryNoteId,
        productId: i.item.productId,
        productCode: i.product?.code || null,
        productName: i.product?.name || null,
        quantity: parseFloat(i.item.quantity),
        unitPrice: parseFloat(i.item.unitPrice),
        discountPercent: parseFloat(i.item.discountPercent || "0"),
        lineTotal: parseFloat(i.item.lineTotal),
      })),
    };
  } catch (error) {
    console.error("Error getting delivery note by ID", error);
    return null;
  }
};

