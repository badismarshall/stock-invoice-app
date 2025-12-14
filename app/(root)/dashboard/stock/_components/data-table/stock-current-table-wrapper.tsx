import { SearchParams } from "@/types"
import { searchParamsCache } from "../../_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getStockCurrentQuery } from "../../_lib/queries"
import { StockCurrentTable } from "./stock-current-table"
import { getAllActiveCategories } from "../../_lib/actions"

interface StockCurrentTableWrapperProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function StockCurrentTableWrapper({ searchParams }: StockCurrentTableWrapperProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  const validFilters = getValidFilters(search.filters);

  const promises = getStockCurrentQuery({
    ...search,
    filters: validFilters,
  });

  // Fetch categories for the filter
  const categoriesResult = await getAllActiveCategories();
  const categories = categoriesResult.data || [];

  return <StockCurrentTable promises={promises} categories={categories} />
}

