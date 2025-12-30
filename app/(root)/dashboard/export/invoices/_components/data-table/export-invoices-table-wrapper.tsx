import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getExportInvoices } from "../../_lib/queries";
import { ExportInvoicesTable } from "./export-invoices-table";
import { getAllClients } from "../../_lib/actions";
import type { SearchParams } from "@/types";

interface ExportInvoicesTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function ExportInvoicesTableWrapper({ searchParams }: ExportInvoicesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const clientsResult = await getAllClients();
  const clients = clientsResult.data || [];

  const promises = getExportInvoices({
    ...search,
    filters: validFilters,
  });

  // Use a unique key based on search params to force React to recreate the component on page change
  const tableKey = JSON.stringify({
    page: search.page,
    perPage: search.perPage,
    sort: search.sort,
    filters: search.filters,
  });

  return <ExportInvoicesTable key={tableKey} promises={promises} clients={clients} />
}

