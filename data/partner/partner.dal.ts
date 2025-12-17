import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
} from "drizzle-orm";
import db from "@/db";
import { partner } from "@/db/schema";
import type { GetPartnersSchema } from "@/app/(root)/dashboard/clients-suppliers/_lib/validation";
import type { PartnerDTO } from "./partner.dto";
import { filterColumns } from "@/lib/data-table/filter-columns";

export const getPartners = async (input: GetPartnersSchema & { type: "client" | "fournisseur" }): Promise<PartnerDTO> => {
  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: partner,
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

    // Build where clause
    const where = advancedTable
    ? and(
        advancedWhere,
        eq(partner.type, input.type)
      )
    : and(
      // Filter by type
      eq(partner.type, input.type),
      // Search by name, email, phone, nif, or rc (basic toolbar filters)
      input.name || input.email || input.phone || input.nif || input.rc
        ? or(
            input.name ? ilike(partner.name, `%${input.name}%`) : undefined,
            input.email ? ilike(partner.email, `%${input.email}%`) : undefined,
            input.phone ? ilike(partner.phone, `%${input.phone}%`) : undefined,
            input.nif ? ilike(partner.nif, `%${input.nif}%`) : undefined,
            input.rc ? ilike(partner.rc, `%${input.rc}%`) : undefined,
          )
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
    );

    // Map sort IDs to actual partner table columns
    const columnMap = {
      id: partner.id,
      name: partner.name,
      contact: partner.contact,
      phone: partner.phone,
      email: partner.email,
      address: partner.address,
      credit: partner.credit,
      nif: partner.nif,
      rc: partner.rc,
      type: partner.type,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
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
        : [desc(partner.createdAt)];

    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(partner)
        .limit(input.perPage)
        .offset(offset)
        .where(where)
        .orderBy(...orderBy);

      const total = await tx
        .select({
          count: count(),
        })
        .from(partner)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    return {
      partners: data.map((p) => ({
        id: p.id,
        name: p.name,
        contact: p.contact,
        phone: p.phone,
        email: p.email,
        address: p.address,
        credit: p.credit,
        nif: p.nif,
        rc: p.rc,
        type: p.type,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      options: {
        totalCount: total,
        limit: input.perPage,
        offset: offset,
      },
    };
  } catch (error) {
    console.error("Error getting partners", error);
    return {
      partners: [],
      options: {
        totalCount: 0,
        limit: input.perPage,
        offset: 0,
      },
    };
  }
};

