import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getPurchaseOrders } from "../../_lib/queries";
import { PurchaseOrdersTable } from "./purchase-orders-table";
import type { SearchParams } from "@/types";

interface PurchaseOrdersTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function PurchaseOrdersTableWrapper({ searchParams }: PurchaseOrdersTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getPurchaseOrders({
    ...search,
    filters: validFilters,
  });

  return <PurchaseOrdersTable promises={promises} />
}

