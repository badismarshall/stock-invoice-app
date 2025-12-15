import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import db from "@/db";
import { deliveryNoteCancellation, deliveryNote, user } from "@/db/schema";
import type { DeliveryNoteCancellationDTO } from "./delivery-note-cancellation.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

type GetDeliveryNoteCancellationsSchema = {
  page: number;
  perPage: number;
  sort: Array<{ id: string; desc: boolean }>;
  filters?: any;
  filterFlag?: "filters" | "advancedFilters" | "commandFilters";
  joinOperator?: "and" | "or";
  search?: string;
  cancellationNumber?: string;
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

    // Advanced filters
    const advancedWhere = input.filters && input.filters.length > 0
      ? (() => {
          const joinFn = input.joinOperator === "and" ? and : or;
          const conditions = input.filters.map((filter: any) => {
            if (!filter.operator) return undefined;
            
            const columnMap = {
              id: deliveryNoteCancellation.id,
              cancellationNumber: deliveryNoteCancellation.cancellationNumber,
              originalNoteNumber: deliveryNote.noteNumber,
              cancellationDate: deliveryNoteCancellation.cancellationDate,
              createdAt: deliveryNoteCancellation.createdAt,
            } as const;

            const column = columnMap[filter.id as keyof typeof columnMap];
            if (!column) return undefined;

            return filterColumns([filter], columnMap)[0];
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
          input.cancellationNumber
            ? ilike(deliveryNoteCancellation.cancellationNumber, `%${input.cancellationNumber}%`)
            : undefined,
        )
      : and(
          // Search by cancellation number or original note number
          input.search
            ? or(
                ilike(deliveryNoteCancellation.cancellationNumber, `%${input.search}%`),
                ilike(deliveryNote.noteNumber, `%${input.search}%`)
              )
            : undefined,
          // Filter by cancellation number (from toolbar)
          input.cancellationNumber
            ? ilike(deliveryNoteCancellation.cancellationNumber, `%${input.cancellationNumber}%`)
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
        );

    // Map sort IDs to actual columns
    const columnMap = {
      id: deliveryNoteCancellation.id,
      cancellationNumber: deliveryNoteCancellation.cancellationNumber,
      originalNoteNumber: deliveryNote.noteNumber,
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
    const query = db
      .select({
        cancellation: deliveryNoteCancellation,
        originalNote: {
          noteNumber: deliveryNote.noteNumber,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(deliveryNoteCancellation)
      .leftJoin(
        deliveryNote,
        eq(deliveryNoteCancellation.originalDeliveryNoteId, deliveryNote.id)
      )
      .leftJoin(user, eq(deliveryNoteCancellation.createdBy, user.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(input.perPage)
      .offset(offset);

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(deliveryNoteCancellation)
      .leftJoin(
        deliveryNote,
        eq(deliveryNoteCancellation.originalDeliveryNoteId, deliveryNote.id)
      )
      .where(where);

    const [data, countResult] = await Promise.all([query, countQuery]);
    const total = Number(countResult[0]?.count || 0);

    return {
      cancellations: data.map((item) => ({
        id: item.cancellation.id,
        cancellationNumber: item.cancellation.cancellationNumber,
        originalDeliveryNoteId: item.cancellation.originalDeliveryNoteId,
        originalNoteNumber: item.originalNote?.noteNumber || null,
        cancellationDate:
          typeof item.cancellation.cancellationDate === "string"
            ? new Date(item.cancellation.cancellationDate + "T00:00:00")
            : item.cancellation.cancellationDate,
        reason: item.cancellation.reason,
        createdBy: item.cancellation.createdBy,
        createdByName: item.creator?.name || null,
        createdAt: item.cancellation.createdAt,
      })),
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

