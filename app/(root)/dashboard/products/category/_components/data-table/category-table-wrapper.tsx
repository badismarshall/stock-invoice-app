import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getCategories } from "../../_lib/queries";
import { CategoryTable } from "./category-table";
import type { SearchParams } from "@/types";

interface CategoryTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function CategoryTableWrapper({ searchParams }: CategoryTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getCategories({
    ...search,
    filters: validFilters,
  });

  return <CategoryTable promises={promises} />
}

