import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getPurchaseInvoices } from "../../_lib/queries";
import { PurchaseInvoicesTable } from "./purchase-invoices-table";
import { getAllSuppliers } from "../../../_lib/actions";
import type { SearchParams } from "@/types";

interface PurchaseInvoicesTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function PurchaseInvoicesTableWrapper({ searchParams }: PurchaseInvoicesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const suppliersResult = await getAllSuppliers();
  const suppliers = suppliersResult.data || [];

  const promises = getPurchaseInvoices({
    ...search,
    filters: validFilters,
  });

  return <PurchaseInvoicesTable promises={promises} suppliers={suppliers} />
}

