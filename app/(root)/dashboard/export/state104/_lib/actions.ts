"use server";

import { getErrorMessage } from "@/lib/handle-error";
import { getState104 as getState104DAL } from "@/data/state104/state104.dal";
import type { GetState104Schema } from "./validation";
import { getAllClients } from "../../../sales/_lib/actions";

const SALE_EXPORT = "sale_export" as const;

export async function getAllClientsForState104() {
  try {
    const result = await getAllClients();
    return { data: result.data || [], error: null as string | null };
  } catch (err) {
    console.error("Error getting clients for state104 export", err);
    return { data: [], error: getErrorMessage(err) };
  }
}

export async function getState104ForTable(
  input?: Partial<GetState104Schema> & { perPage?: number; page?: number },
) {
  try {
    const result = await getState104DAL({
      page: input?.page ?? 1,
      perPage: input?.perPage ?? 10000,
      sort: input?.sort ?? [{ id: "clientName", desc: false }],
      filters: input?.filters ?? [],
      filterFlag: input?.filterFlag || undefined,
      joinOperator: input?.joinOperator ?? "and",
      clientId: input?.clientId ?? [],
      date: input?.date ?? [],
      address: input?.address,
      nif: input?.nif,
      rcs: input?.rcs,
      invoiceType: SALE_EXPORT,
    });

    return { data: result.rows, error: null as string | null };
  } catch (err) {
    console.error("Error exporting Etat104 (export)", err);
    return { data: [], error: getErrorMessage(err) };
  }
}
