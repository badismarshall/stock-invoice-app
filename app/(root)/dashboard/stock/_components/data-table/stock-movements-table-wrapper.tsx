import { SearchParams } from "@/types"
import { searchParamsCache } from "../../_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getStockMovementsQuery } from "../../_lib/queries"
import { StockMovementsTable } from "./stock-movements-table"

interface StockMovementsTableWrapperProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function StockMovementsTableWrapper({ searchParams }: StockMovementsTableWrapperProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  const validFilters = getValidFilters(search.filters);

  const promises = getStockMovementsQuery({
    ...search,
    filters: validFilters,
  });

  return <StockMovementsTable promises={promises} />
}

