import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getInvoices } from "../../_lib/queries";
import { InvoicesTable } from "./invoices-table";
import { getAllClients, getAllSuppliers } from "../../_lib/actions";
import type { SearchParams } from "@/types";

interface InvoicesTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function InvoicesTableWrapper({ searchParams }: InvoicesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const [clientsResult, suppliersResult] = await Promise.all([
    getAllClients(),
    getAllSuppliers(),
  ]);
  
  const clients = clientsResult.data || [];
  const suppliers = suppliersResult.data || [];

  const promises = getInvoices({
    ...search,
    filters: validFilters,
  });

  return <InvoicesTable promises={promises} clients={clients} suppliers={suppliers} />
}

