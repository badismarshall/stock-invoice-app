import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getPartners } from "../../_lib/queries";
import { PartnersTable } from "./partners-table";
import type { SearchParams } from "@/types";

interface SuppliersTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function SuppliersTableWrapper({ searchParams }: SuppliersTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getPartners({
    ...search,
    filters: validFilters,
    type: "fournisseur",
  });

  return <PartnersTable promises={promises} />
}

