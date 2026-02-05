import "server-only";

import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import db from "@/db";
import { invoice, partner } from "@/db/schema";
import type { State104DTO } from "./state104.dto";

type GetState104Schema = {
  page: number;
  perPage: number;
  sort: Array<{ id: string; desc: boolean }>;
  filters?: any;
  filterFlag?: "filters" | "advancedFilters" | "commandFilters";
  joinOperator?: "and" | "or";
  clientId?: string[];
  date?: number[];
  address?: string;
  nif?: string;
  rcs?: string;
  /** "sale_local" for /sales, "sale_export" for /export */
  invoiceType?: "sale_local" | "sale_export";
};

const SALE_LOCAL = "sale_local" as const;
const SALE_EXPORT = "sale_export" as const;

function toDateStr(ts: number) {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getState104(input: GetState104Schema): Promise<State104DTO> {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" || input.filterFlag === "commandFilters";

    // Reusable aggregate expressions
    const totalTvaExpr = sql<string>`COALESCE(SUM(${invoice.taxAmount}), 0)`;
    const saleAmountHTExpr = sql<string>`COALESCE(SUM(${invoice.subtotal}), 0)`;
    const saleAmountTTCExpr = sql<string>`COALESCE(SUM(${invoice.totalAmount}), 0)`;

    // Advanced filter handling (from filters array, same as delivery-note.dal)
    const advancedWhere =
      input.filters && input.filters.length > 0
        ? (() => {
            const joinFn = input.joinOperator === "or" ? or : and;
            const conditions = (input.filters as any[]).map((filter) => {
              if (!filter?.operator) return undefined;

              switch (filter.id) {
                case "clientId":
                  if (filter.operator === "inArray" && Array.isArray(filter.value))
                    return inArray(invoice.clientId, filter.value);
                  return undefined;
                case "clientName":
                  if (filter.operator === "iLike" && typeof filter.value === "string")
                    return ilike(partner.name, `%${filter.value}%`);
                  return undefined;
                case "address":
                  if (filter.operator === "iLike" && typeof filter.value === "string")
                    return ilike(partner.address, `%${filter.value}%`);
                  return undefined;
                case "nif":
                  if (filter.operator === "iLike" && typeof filter.value === "string")
                    return ilike(partner.nafApe, `%${filter.value}%`);
                  return undefined;
                case "rcs":
                  if (filter.operator === "iLike" && typeof filter.value === "string")
                    return ilike(partner.rcsRm, `%${filter.value}%`);
                  return undefined;
                case "date":
                  if (
                    filter.operator === "isBetween" &&
                    Array.isArray(filter.value) &&
                    filter.value.length === 2
                  ) {
                    const start = filter.value[0] ? toDateStr(Number(filter.value[0])) : null;
                    const end = filter.value[1] ? toDateStr(Number(filter.value[1])) : null;
                    return and(
                      start ? gte(invoice.invoiceDate, start) : undefined,
                      end ? lte(invoice.invoiceDate, end) : undefined,
                    );
                  }
                  return undefined;
                default:
                  return undefined;
              }
            });

            const valid = conditions.filter(Boolean);
            return valid.length > 0 ? joinFn(...valid) : undefined;
          })()
        : undefined;

    const invoiceTypeFilter =
      input.invoiceType === SALE_EXPORT
        ? eq(invoice.invoiceType, SALE_EXPORT)
        : eq(invoice.invoiceType, SALE_LOCAL);

    const baseWhere = (extra?: any) =>
      and(
        extra,
        eq(invoice.status, "active"),
        invoiceTypeFilter,
        sql`${invoice.clientId} IS NOT NULL`,
      );

    // Basic toolbar filters (same pattern as /sales delivery-notes: input.noteNumber, input.clientId, input.noteDate, etc.)
    const basicWhere = and(
      input.clientId && input.clientId.length > 0 ? inArray(invoice.clientId, input.clientId) : undefined,
      input.address?.trim()
        ? ilike(partner.address, `%${input.address.trim()}%`)
        : undefined,
      input.nif?.trim() ? ilike(partner.nafApe, `%${input.nif.trim()}%`) : undefined,
      input.rcs?.trim() ? ilike(partner.rcsRm, `%${input.rcs.trim()}%`) : undefined,
      input.date && input.date.length > 0
        ? and(
            input.date[0] ? gte(invoice.invoiceDate, toDateStr(input.date[0])) : undefined,
            input.date[1] ? lte(invoice.invoiceDate, toDateStr(input.date[1])) : undefined,
          )
        : undefined,
    );

    const where = advancedTable
      ? baseWhere(advancedWhere)
      : baseWhere(basicWhere);

    const columnMap = {
      clientName: partner.name,
      address: partner.address,
      nif: partner.nafApe,
      rcs: partner.rcsRm,
      saleAmountHT: saleAmountHTExpr,
      saleAmountTTC: saleAmountTTCExpr,
      totalTva: totalTvaExpr,
    } as const;

    const orderBy =
      input.sort && input.sort.length > 0
        ? input.sort
            .map((s) => {
              const col = columnMap[s.id as keyof typeof columnMap];
              if (!col) return null;
              return s.desc ? desc(col) : asc(col);
            })
            .filter((x): x is ReturnType<typeof asc> | ReturnType<typeof desc> => x !== null)
        : [asc(partner.name)];

    const { rows, totalCount } = await db.transaction(async (tx) => {
      const rowsQuery = tx
        .select({
          clientId: partner.id,
          clientName: partner.name,
          address: partner.address,
          nif: partner.nafApe,
          rcs: partner.rcsRm,
          saleAmountHT: saleAmountHTExpr,
          saleAmountTTC: saleAmountTTCExpr,
          totalTva: totalTvaExpr,
        })
        .from(invoice)
        .innerJoin(partner, eq(invoice.clientId, partner.id))
        .where(where)
        .groupBy(partner.id, partner.name, partner.address, partner.nafApe, partner.rcsRm)
        .orderBy(...orderBy)
        .limit(input.perPage)
        .offset(offset);

      const totalQuery = tx
        .select({
          count: sql<number>`COUNT(DISTINCT ${partner.id})`,
        })
        .from(invoice)
        .innerJoin(partner, eq(invoice.clientId, partner.id))
        .where(where);

      const [rows, total] = await Promise.all([rowsQuery, totalQuery]);
      return {
        rows,
        totalCount: Number(total[0]?.count ?? 0),
      };
    });

    return {
      rows: rows.map((r) => ({
        clientId: r.clientId,
        clientName: r.clientName,
        address: r.address ?? null,
        nif: r.nif ?? null,
        rcs: r.rcs ?? null,
        saleAmountHT: r.saleAmountHT ?? "0",
        saleAmountTTC: r.saleAmountTTC ?? "0",
        totalTva: r.totalTva ?? "0",
      })),
      options: {
        totalCount,
        limit: input.perPage,
        offset,
      },
    };
  } catch (error) {
    console.error("Error getting Etat104 (state104)", error);
    return {
      rows: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: 0,
      },
    };
  }
}

