import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getDeliveryNotesInvoices } from "../../_lib/queries";
import { DeliveryNotesInvoicesTable } from "./delivery-notes-invoices-table";
import { getAllClients } from "../../../_lib/actions";
import type { SearchParams } from "@/types";

interface DeliveryNotesInvoicesTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function DeliveryNotesInvoicesTableWrapper({ searchParams }: DeliveryNotesInvoicesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const clientsResult = await getAllClients();
  const clients = clientsResult.data || [];

  const promises = getDeliveryNotesInvoices({
    ...search,
    filters: validFilters,
  });

  return <DeliveryNotesInvoicesTable promises={promises} clients={clients} />
}

