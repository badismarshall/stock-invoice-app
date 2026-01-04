import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getProducts } from "../../_lib/queries";
import { ProductsTable } from "./products-table";
import type { SearchParams } from "@/types";
import { getAllActiveCategories } from "../../_lib/actions";
import { getAllActiveUnitsOfMeasure } from "../../_lib/unit-of-measure-actions";

interface ProductsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function ProductsTableWrapper({ searchParams }: ProductsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const [categoriesResult, unitsResult] = await Promise.all([
    getAllActiveCategories(),
    getAllActiveUnitsOfMeasure(),
  ]);

  const promises = getProducts({
    ...search,
    filters: validFilters,
  });

  return (
    <ProductsTable 
      promises={promises} 
      categories={categoriesResult.data || []}
      unitsOfMeasure={unitsResult.data || []}
    />
  )
}

