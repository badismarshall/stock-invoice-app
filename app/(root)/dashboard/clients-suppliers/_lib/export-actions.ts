"use server";

import { getErrorMessage } from "@/lib/handle-error";
import type { GetPartnersSchema } from "./validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import db from "@/db";
import { partner } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, ilike, inArray, or, sql, ne, notInArray, lt, gt } from "drizzle-orm";

/**
 * Get partners by IDs for export
 */
export async function getPartnersByIds(input: { ids: string[]; type?: "client" | "fournisseur" }) {
  try {
    if (!input.ids || input.ids.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const whereConditions = [
      inArray(partner.id, input.ids),
      input.type ? eq(partner.type, input.type) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined);

    const partners = await db
      .select()
      .from(partner)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(asc(partner.name));
    
    return {
      data: partners.map((p) => ({
        id: p.id,
        name: p.name || null,
        contact: p.contact || null,
        phone: p.phone || null,
        email: p.email || null,
        address: p.address || null,
        credit: p.credit || null,
        nafApe: p.nafApe || null,
        rcsRm: p.rcsRm || null,
        eori: p.eori || null,
        tvaNumber: p.tvaNumber || null,
        type: p.type,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting partners by IDs for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get filtered partners for export based on table filters
 */
export async function getFilteredPartnersForExport(input: GetPartnersSchema & { type?: "client" | "fournisseur" }) {
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
              case "name":
                column = partner.name;
                break;
              case "phone":
                column = partner.phone;
                break;
              case "email":
                column = partner.email;
                break;
              case "address":
                column = partner.address;
                break;
              case "nafApe":
                column = partner.nafApe;
                break;
              case "rcsRm":
                column = partner.rcsRm;
                break;
              case "createdAt":
                column = partner.createdAt;
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
    const simpleWhereConditions = [
      // Search by name
      input.name
        ? ilike(partner.name, `%${input.name}%`)
        : undefined,
      // Search by phone
      input.phone
        ? ilike(partner.phone, `%${input.phone}%`)
        : undefined,
      // Search by email
      input.email
        ? ilike(partner.email, `%${input.email}%`)
        : undefined,
      // Search by address
      input.address
        ? ilike(partner.address, `%${input.address}%`)
        : undefined,
      // Search by nafApe
      input.nafApe
        ? ilike(partner.nafApe, `%${input.nafApe}%`)
        : undefined,
      // Search by rcsRm
      input.rcsRm
        ? ilike(partner.rcsRm, `%${input.rcsRm}%`)
        : undefined,
      // Filter by createdAt date range
      input.createdAt.length > 0
        ? and(
            input.createdAt[0]
              ? gte(
                  partner.createdAt,
                  (() => {
                    const date = new Date(input.createdAt[0]);
                    date.setHours(0, 0, 0, 0);
                    return date;
                  })(),
                )
              : undefined,
            input.createdAt[1]
              ? lte(
                  partner.createdAt,
                  (() => {
                    const date = new Date(input.createdAt[1]);
                    date.setHours(23, 59, 59, 999);
                    return date;
                  })(),
                )
              : undefined,
          )
        : undefined,
      // Filter by type
      input.type
        ? eq(partner.type, input.type)
        : undefined,
    ].filter(Boolean);

    const where = advancedTable
      ? and(
          advancedWhere,
          input.type ? eq(partner.type, input.type) : undefined,
        )
      : simpleWhereConditions.length > 0
        ? and(...simpleWhereConditions)
        : input.type
          ? eq(partner.type, input.type)
          : undefined;
    
    // Get all partners matching filters
    const partners = await db
      .select()
      .from(partner)
      .where(where)
      .orderBy(asc(partner.name));
    
    return {
      data: partners.map((p) => ({
        id: p.id,
        name: p.name || null,
        contact: p.contact || null,
        phone: p.phone || null,
        email: p.email || null,
        address: p.address || null,
        credit: p.credit || null,
        nafApe: p.nafApe || null,
        rcsRm: p.rcsRm || null,
        eori: p.eori || null,
        tvaNumber: p.tvaNumber || null,
        type: p.type,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting filtered partners for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

