import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getState104 } from "../../_lib/queries";
import { getAllClientsForState104 } from "../../_lib/actions";
import type { SearchParams } from "@/types";
import { State104Table } from "./state104-table";

interface State104TableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function State104TableWrapper({ searchParams }: State104TableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);
  const validFilters = getValidFilters(search.filters);

  const clientsResult = await getAllClientsForState104();
  const clients = clientsResult.data || [];

  const promises = getState104({
    ...search,
    filters: validFilters,
  });

  return (
    <State104Table
      key={new URLSearchParams(searchParamsResolved as Record<string, string>).toString()}
      promises={promises}
      clients={clients}
    />
  );
}
