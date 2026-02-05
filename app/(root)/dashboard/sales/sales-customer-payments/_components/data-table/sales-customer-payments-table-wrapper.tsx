import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getSalesCustomerPayments } from "../../_lib/queries";
import { SalesCustomerPaymentsTable } from "./sales-customer-payments-table";
import { getAllClientsForPayments } from "../../_lib/actions";
import type { SearchParams } from "@/types";

interface SalesCustomerPaymentsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function SalesCustomerPaymentsTableWrapper({ searchParams }: SalesCustomerPaymentsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const clientsResult = await getAllClientsForPayments();
  const clients = clientsResult.data || [];

  // Pass all search params to DAL (same pattern as delivery-notes and sale_invoice)
  const promises = getSalesCustomerPayments({
    ...search,
    filters: validFilters,
  });

  return (
    <SalesCustomerPaymentsTable
      key={new URLSearchParams(searchParamsResolved as Record<string, string>).toString()}
      promises={promises}
      clients={clients}
    />
  );
}

