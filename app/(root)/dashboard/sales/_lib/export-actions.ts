"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetDeliveryNotesSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { deliveryNote, deliveryNoteItem, partner, product, user } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or, sql, ne, notInArray, lt, gt } from "drizzle-orm";

/**
 * Get delivery notes by IDs with their items for export
 */
export async function getDeliveryNotesByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const notes = await db
      .select({
        deliveryNote: deliveryNote,
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
      })
      .from(deliveryNote)
      .leftJoin(partner, eq(deliveryNote.clientId, partner.id))
      .leftJoin(user, eq(deliveryNote.createdBy, user.id))
      .where(inArray(deliveryNote.id, input.ids))
      .orderBy(desc(deliveryNote.noteDate), desc(deliveryNote.createdAt));
    
    // Get items for each delivery note
    const notesWithItems = await Promise.all(
      notes.map(async (note) => {
        const items = await db
          .select({
            item: deliveryNoteItem,
            product: {
              id: product.id,
              name: product.name,
              code: product.code,
            },
          })
          .from(deliveryNoteItem)
          .leftJoin(product, eq(deliveryNoteItem.productId, product.id))
          .where(eq(deliveryNoteItem.deliveryNoteId, note.deliveryNote.id))
          .orderBy(asc(deliveryNoteItem.id));
        
        const noteDate = typeof note.deliveryNote.noteDate === 'string'
          ? new Date(note.deliveryNote.noteDate + 'T00:00:00')
          : new Date(note.deliveryNote.noteDate);
        
        return {
          id: note.deliveryNote.id,
          noteNumber: note.deliveryNote.noteNumber,
          noteType: note.deliveryNote.noteType || "local",
          clientId: note.deliveryNote.clientId,
          clientName: note.client?.name || null,
          clientAddress: note.client?.address || null,
          clientPhone: note.client?.phone || null,
          clientEmail: note.client?.email || null,
          noteDate,
          status: note.deliveryNote.status || "active",
          currency: note.deliveryNote.currency || null,
          destinationCountry: note.deliveryNote.destinationCountry || null,
          deliveryLocation: note.deliveryNote.deliveryLocation || null,
          notes: note.deliveryNote.notes,
          createdBy: note.deliveryNote.createdBy,
          createdByName: note.creator?.name || null,
          createdAt: note.deliveryNote.createdAt,
          items: items.map((i) => ({
            id: i.item.id,
            productId: i.item.productId,
            productName: i.product?.name || null,
            productCode: i.product?.code || null,
            quantity: parseFloat(i.item.quantity),
            unitPrice: parseFloat(i.item.unitPrice),
            discountPercent: parseFloat(i.item.discountPercent || "0"),
            lineTotal: parseFloat(i.item.lineTotal),
          })),
        };
      })
    );
    
    return {
      data: notesWithItems,
      error: null,
    };
  } catch (err) {
    console.error("Error getting delivery notes by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered delivery notes with items for export based on table filters
 */
export async function getFilteredDeliveryNotesForExport(input: GetDeliveryNotesSchema) {
  try {
    const validFilters = getValidFilters(input.filters);
    const advancedTable = input.filterFlag === "advancedFilters" || input.filterFlag === "commandFilters";
    
    // Build advanced filters (same logic as DAL)
    const advancedWhere = validFilters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = validFilters.map((filter: any) => {
            if (!filter.operator) return undefined;
            
            // Get the column
            let column: any;
            switch (filter.id) {
              case "noteNumber":
                column = deliveryNote.noteNumber;
                break;
              case "clientId":
                column = deliveryNote.clientId;
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

    // Build where clause (same logic as DAL)
    const where = advancedTable
      ? and(
          advancedWhere || undefined,
          inArray(deliveryNote.noteType, ["local"])
        )
      : and(
          // Search by note number or client name
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
          // Filter by note number
          input.noteNumber
            ? ilike(deliveryNote.noteNumber, `%${input.noteNumber}%`)
            : undefined,
          // Filter by note type (always local for sales)
          inArray(deliveryNote.noteType, ["local"]),
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
    
    // Get all delivery notes matching filters
    const notes = await db
      .select({
        deliveryNote: deliveryNote,
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
      })
      .from(deliveryNote)
      .leftJoin(partner, eq(deliveryNote.clientId, partner.id))
      .leftJoin(user, eq(deliveryNote.createdBy, user.id))
      .where(where)
      .orderBy(desc(deliveryNote.noteDate), desc(deliveryNote.createdAt));
    
    // Get items for each delivery note
    const notesWithItems = await Promise.all(
      notes.map(async (note) => {
        const items = await db
          .select({
            item: deliveryNoteItem,
            product: {
              id: product.id,
              name: product.name,
              code: product.code,
            },
          })
          .from(deliveryNoteItem)
          .leftJoin(product, eq(deliveryNoteItem.productId, product.id))
          .where(eq(deliveryNoteItem.deliveryNoteId, note.deliveryNote.id))
          .orderBy(asc(deliveryNoteItem.id));
        
        const noteDate = typeof note.deliveryNote.noteDate === 'string'
          ? new Date(note.deliveryNote.noteDate + 'T00:00:00')
          : new Date(note.deliveryNote.noteDate);
        
        return {
          id: note.deliveryNote.id,
          noteNumber: note.deliveryNote.noteNumber,
          noteType: note.deliveryNote.noteType || "local",
          clientId: note.deliveryNote.clientId,
          clientName: note.client?.name || null,
          clientAddress: note.client?.address || null,
          clientPhone: note.client?.phone || null,
          clientEmail: note.client?.email || null,
          noteDate,
          status: note.deliveryNote.status || "active",
          currency: note.deliveryNote.currency || null,
          destinationCountry: note.deliveryNote.destinationCountry || null,
          deliveryLocation: note.deliveryNote.deliveryLocation || null,
          notes: note.deliveryNote.notes,
          createdBy: note.deliveryNote.createdBy,
          createdByName: note.creator?.name || null,
          createdAt: note.deliveryNote.createdAt,
          items: items.map((i) => ({
            id: i.item.id,
            productId: i.item.productId,
            productName: i.product?.name || null,
            productCode: i.product?.code || null,
            quantity: parseFloat(i.item.quantity),
            unitPrice: parseFloat(i.item.unitPrice),
            discountPercent: parseFloat(i.item.discountPercent || "0"),
            lineTotal: parseFloat(i.item.lineTotal),
          })),
        };
      })
    );
    
    return {
      data: notesWithItems,
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered delivery notes for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

