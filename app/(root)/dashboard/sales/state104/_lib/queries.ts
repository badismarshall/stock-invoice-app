"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getState104 as getState104DAL } from "@/data/state104/state104.dal";
import type { GetState104Schema } from "./validation";

export async function getState104(input: GetState104Schema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("state104");

  try {
    const result = await getState104DAL({
      page: input.page,
      perPage: input.perPage,
      sort: input.sort,
      filters: input.filters,
      filterFlag: input.filterFlag || undefined,
      joinOperator: input.joinOperator,
      clientId: input.clientId,
      date: input.date,
      address: input.address || undefined,
      nif: input.nif || undefined,
      rcs: input.rcs || undefined,
    });

    const pageCount = Math.ceil(result.options.totalCount / input.perPage);
    return { data: result.rows, pageCount };
  } catch (error) {
    console.error("Error in getState104 service", error);
    return { data: [], pageCount: 0 };
  }
}

