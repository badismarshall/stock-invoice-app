"use server";

import { getErrorMessage } from "@/lib/handle-error";
import { getState104 as getState104DAL } from "@/data/state104/state104.dal";
import type { GetState104Schema } from "./validation";
import { getAllClients } from "../../_lib/actions";

export async function getAllClientsForState104() {
  return getAllClients();
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
    });

    return { data: result.rows, error: null as string | null };
  } catch (err) {
    console.error("Error exporting Etat104", err);
    return { data: [], error: getErrorMessage(err) };
  }
}
