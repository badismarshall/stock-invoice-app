import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getPartners } from "../../_lib/queries";
import { PartnersTable } from "./partners-table";
import type { SearchParams } from "@/types";

interface ClientsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function ClientsTableWrapper({ searchParams }: ClientsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getPartners({
    ...search,
    filters: validFilters,
    type: "client",
  });

  return <PartnersTable promises={promises} />
}

