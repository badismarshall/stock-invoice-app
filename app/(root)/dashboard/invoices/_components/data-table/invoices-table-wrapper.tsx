import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getInvoices } from "../../_lib/queries";
import { InvoicesTable } from "./invoices-table";
import { getAllClients, getAllSuppliers } from "../../_lib/actions";
import type { SearchParams } from "@/types";

interface InvoicesTableWrapperProps {
  searchParams: Promise<SearchParams>;
  invoiceTypeFilter?: ("sale_local" | "sale_export" | "purchase" | "proforma" | "delivery_note_invoice")[];
}

export async function InvoicesTableWrapper({ searchParams, invoiceTypeFilter }: InvoicesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const [clientsResult, suppliersResult] = await Promise.all([
    getAllClients(),
    getAllSuppliers(),
  ]);
  
  const clients = clientsResult.data || [];
  const suppliers = suppliersResult.data || [];

  // Apply invoiceTypeFilter if provided, otherwise use search params
  const invoiceType = invoiceTypeFilter && invoiceTypeFilter.length > 0
    ? invoiceTypeFilter
    : search.invoiceType;

  // Hide supplier and invoiceType filters for sale_locale and sale_export
  const hideSupplierFilter = invoiceTypeFilter && invoiceTypeFilter.length === 1 && (invoiceTypeFilter[0] === "sale_local" || invoiceTypeFilter[0] === "sale_export");
  const hideInvoiceTypeFilter = invoiceTypeFilter && invoiceTypeFilter.length === 1 && (invoiceTypeFilter[0] === "sale_local" || invoiceTypeFilter[0] === "sale_export");
  const hideSupplierColumn = invoiceTypeFilter && invoiceTypeFilter.length === 1 && (invoiceTypeFilter[0] === "sale_local" || invoiceTypeFilter[0] === "sale_export");
  
  // Hide client column and filter for purchase
  const hideClientColumn = invoiceTypeFilter && invoiceTypeFilter.length === 1 && invoiceTypeFilter[0] === "purchase";
  const hideClientFilter = invoiceTypeFilter && invoiceTypeFilter.length === 1 && invoiceTypeFilter[0] === "purchase";

  const promises = getInvoices({
    ...search,
    invoiceType,
    filters: validFilters,
  });

  return <InvoicesTable promises={promises} clients={clients} suppliers={suppliers} hideSupplierFilter={hideSupplierFilter} hideInvoiceTypeFilter={hideInvoiceTypeFilter} hideSupplierColumn={hideSupplierColumn} hideClientColumn={hideClientColumn} hideClientFilter={hideClientFilter} />
}

