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

  return <ExportInvoicesTable promises={promises} clients={clients} />
}

