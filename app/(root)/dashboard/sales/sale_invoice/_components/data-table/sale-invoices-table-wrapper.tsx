import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getSaleInvoices } from "../../_lib/queries";
import { SaleInvoicesTable } from "./sale-invoices-table";
import { getAllClients } from "../../../_lib/actions";
import type { SearchParams } from "@/types";

interface SaleInvoicesTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function SaleInvoicesTableWrapper({ searchParams }: SaleInvoicesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const clientsResult = await getAllClients();
  const clients = clientsResult.data || [];

  const promises = getSaleInvoices({
    ...search,
    filters: validFilters,
  });

  return <SaleInvoicesTable promises={promises} clients={clients} />
}

