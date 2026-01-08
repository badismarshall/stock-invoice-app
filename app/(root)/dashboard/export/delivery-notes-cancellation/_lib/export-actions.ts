"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetDeliveryNoteCancellationsSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { deliveryNoteCancellation, deliveryNote, partner, user } from "@/db/schema";
import { eq, and, gte, lte, desc, ilike, inArray, or, sql, ne, notInArray, lt, gt } from "drizzle-orm";

/**
 * Get delivery note cancellations by IDs for export (export delivery notes only)
 */
export async function getCancellationsByIds(input: { ids: string[] }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const cancellations = await db
      .select({
        cancellation: deliveryNoteCancellation,
        originalDeliveryNote: {
          noteNumber: deliveryNote.noteNumber,
          noteType: deliveryNote.noteType,
        },
        client: {
          name: partner.name,
        },
        createdByUser: {
          name: user.name,
        },
      })
      .from(deliveryNoteCancellation)
      .leftJoin(deliveryNote, eq(deliveryNoteCancellation.originalDeliveryNoteId, deliveryNote.id))
      .leftJoin(partner, eq(deliveryNoteCancellation.clientId, partner.id))
      .leftJoin(user, eq(deliveryNoteCancellation.createdBy, user.id))
      .where(
        and(
          inArray(deliveryNoteCancellation.id, input.ids),
          eq(deliveryNote.noteType, "export") // Filter by export delivery notes only
        )
      )
      .orderBy(desc(deliveryNoteCancellation.cancellationDate));
    
    return {
      data: cancellations.map((c) => ({
        id: c.cancellation.id,
        cancellationNumber: c.cancellation.cancellationNumber,
        originalDeliveryNoteId: c.cancellation.originalDeliveryNoteId,
        originalDeliveryNoteNumber: c.originalDeliveryNote?.noteNumber || null,
        clientId: c.cancellation.clientId,
        clientName: c.client?.name || null,
        cancellationDate: c.cancellation.cancellationDate,
        reason: c.cancellation.reason,
        createdBy: c.cancellation.createdBy,
        createdByName: c.createdByUser?.name || null,
        createdAt: c.cancellation.createdAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting cancellations by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered delivery note cancellations for export based on table filters (export delivery notes only)
 */
export async function getFilteredCancellationsForExport(input: GetDeliveryNoteCancellationsSchema) {
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
              case "cancellationNumber":
                column = deliveryNoteCancellation.cancellationNumber;
                break;
              case "originalDeliveryNoteNumber":
                // This requires a join, handled separately
                return undefined;
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
                    return sql`${column} < ${dateStr}`;
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(23, 59, 59, 999);
                    return lt(column, date);
                  }
                }
                return undefined;

              case "lte":
                if (isDateType) {
                  const date = new Date(Number(filter.value));
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  return sql`${column} <= ${dateStr}`;
                } else if (isTimestampType) {
                  const date = new Date(Number(filter.value));
                  date.setHours(23, 59, 59, 999);
                  return lte(column, date);
                }
                return undefined;

              case "gt":
                if (filter.variant === "date" && typeof filter.value === "string") {
                  if (isDateType) {
                    const date = new Date(Number(filter.value));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    return sql`${column} > ${dateStr}`;
                  } else if (isTimestampType) {
                    const date = new Date(Number(filter.value));
                    date.setHours(0, 0, 0, 0);
                    return gt(column, date);
                  }
                }
                return undefined;

              case "gte":
                if (isDateType) {
                  const date = new Date(Number(filter.value));
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  return sql`${column} >= ${dateStr}`;
                } else if (isTimestampType) {
                  const date = new Date(Number(filter.value));
                  date.setHours(0, 0, 0, 0);
                  return gte(column, date);
                }
                return undefined;

              case "isBetween":
                if (
                  (filter.variant === "date" || filter.variant === "dateRange") &&
                  Array.isArray(filter.value) &&
                  filter.value.length === 2
                ) {
                  if (isDateType) {
                    return and(
                      filter.value[0]
                        ? sql`${column} >= ${(() => {
                            const date = new Date(Number(filter.value[0]));
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()}`
                        : undefined,
                      filter.value[1]
                        ? sql`${column} <= ${(() => {
                            const date = new Date(Number(filter.value[1]));
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()}`
                        : undefined,
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
      ? and(
          advancedWhere,
          eq(deliveryNote.noteType, "export") // Filter by export delivery notes only
        )
      : and(
          // Filter by export delivery notes only
          eq(deliveryNote.noteType, "export"),
          // Search by cancellation number or original delivery note number
          input.cancellationNumber || input.originalDeliveryNoteNumber
            ? or(
                input.cancellationNumber ? ilike(deliveryNoteCancellation.cancellationNumber, `%${input.cancellationNumber}%`) : undefined,
                input.originalDeliveryNoteNumber ? ilike(deliveryNote.noteNumber, `%${input.originalDeliveryNoteNumber}%`) : undefined,
              )
            : undefined,
          // Filter by client
          input.clientId && input.clientId.length > 0
            ? inArray(deliveryNoteCancellation.clientId, input.clientId)
            : undefined,
          // Filter by cancellationDate date range
          input.cancellationDate && input.cancellationDate.length > 0
            ? and(
                input.cancellationDate[0]
                  ? sql`${deliveryNoteCancellation.cancellationDate} >= ${(() => {
                      const date = new Date(input.cancellationDate[0]);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })}`
                  : undefined,
                input.cancellationDate[1]
                  ? sql`${deliveryNoteCancellation.cancellationDate} <= ${(() => {
                      const date = new Date(input.cancellationDate[1]);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })}`
                  : undefined,
              )
            : undefined,
          // Filter by createdAt date range
          input.createdAt && input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      deliveryNoteCancellation.createdAt,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      deliveryNoteCancellation.createdAt,
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
    
    // Get all cancellations matching filters
    const cancellations = await db
      .select({
        cancellation: deliveryNoteCancellation,
        originalDeliveryNote: {
          noteNumber: deliveryNote.noteNumber,
        },
        client: {
          name: partner.name,
        },
        createdByUser: {
          name: user.name,
        },
      })
      .from(deliveryNoteCancellation)
      .leftJoin(deliveryNote, eq(deliveryNoteCancellation.originalDeliveryNoteId, deliveryNote.id))
      .leftJoin(partner, eq(deliveryNoteCancellation.clientId, partner.id))
      .leftJoin(user, eq(deliveryNoteCancellation.createdBy, user.id))
      .where(where)
      .orderBy(desc(deliveryNoteCancellation.cancellationDate));
    
    return {
      data: cancellations.map((c) => ({
        id: c.cancellation.id,
        cancellationNumber: c.cancellation.cancellationNumber,
        originalDeliveryNoteId: c.cancellation.originalDeliveryNoteId,
        originalDeliveryNoteNumber: c.originalDeliveryNote?.noteNumber || null,
        clientId: c.cancellation.clientId,
        clientName: c.client?.name || null,
        cancellationDate: c.cancellation.cancellationDate,
        reason: c.cancellation.reason,
        createdBy: c.cancellation.createdBy,
        createdByName: c.createdByUser?.name || null,
        createdAt: c.cancellation.createdAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered cancellations for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

