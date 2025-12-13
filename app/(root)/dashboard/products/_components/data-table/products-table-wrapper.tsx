import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getProducts } from "../../_lib/queries";
import { ProductsTable } from "./products-table";
import type { SearchParams } from "@/types";

interface ProductsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function ProductsTableWrapper({ searchParams }: ProductsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getProducts({
    ...search,
    filters: validFilters,
  });

  return <ProductsTable promises={promises} />
}

