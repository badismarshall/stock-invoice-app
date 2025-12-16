import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getDeliveryNoteCancellations } from "../../_lib/queries";
import { DeliveryNoteCancellationsTable } from "./delivery-note-cancellations-table";
import { getAllClients } from "../../_lib/actions";
import type { SearchParams } from "@/types";

interface DeliveryNoteCancellationsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function DeliveryNoteCancellationsTableWrapper({ searchParams }: DeliveryNoteCancellationsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  // Extract clientId from raw search params (handled by useDataTable hook)
  const rawClientId = searchParamsResolved.clientId;
  const clientId = Array.isArray(rawClientId) 
    ? rawClientId 
    : typeof rawClientId === "string" && rawClientId.includes(",")
      ? rawClientId.split(",").filter(Boolean)
      : typeof rawClientId === "string"
        ? [rawClientId]
        : [];

  const validFilters = getValidFilters(search.filters);

  const [clientsResult] = await Promise.all([
    getAllClients(),
  ]);

  const clients = clientsResult.data || [];

  const promises = getDeliveryNoteCancellations({
    ...search,
    clientId: clientId.length > 0 ? clientId : search.clientId,
    filters: validFilters,
  });

  return <DeliveryNoteCancellationsTable promises={promises} clients={clients} />
}

