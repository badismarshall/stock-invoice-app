import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getUnitsOfMeasure } from "../../_lib/queries";
import { UnitOfMeasureTable } from "./unit-of-measure-table";
import type { SearchParams } from "@/types";

interface UnitOfMeasureTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function UnitOfMeasureTableWrapper({ searchParams }: UnitOfMeasureTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getUnitsOfMeasure({
    ...search,
    filters: validFilters,
  });

  return <UnitOfMeasureTable promises={promises} />
}

