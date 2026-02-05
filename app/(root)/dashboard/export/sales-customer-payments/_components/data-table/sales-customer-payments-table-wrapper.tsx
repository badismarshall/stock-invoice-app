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

  // Format dates for DAL - only include if they have values
  const queryParams: Parameters<typeof getSalesCustomerPayments>[0] = {
    ...search,
    filters: validFilters,
  };

  // Only add optional params if they have values
  if (search.startDate) {
    queryParams.startDate = search.startDate;
  }
  if (search.endDate) {
    queryParams.endDate = search.endDate;
  }
  if (search.clientId && search.clientId.length > 0) {
    queryParams.clientId = search.clientId;
  }
  // Basic toolbar filters
  if (search.date && search.date.length > 0) {
    queryParams.date = search.date;
  }
  if (search.invoiceNumber) {
    queryParams.invoiceNumber = search.invoiceNumber;
  }

  const promises = getSalesCustomerPayments(queryParams);

  return (
    <SalesCustomerPaymentsTable
      key={new URLSearchParams(searchParamsResolved as Record<string, string>).toString()}
      promises={promises}
      clients={clients}
    />
  );
}

