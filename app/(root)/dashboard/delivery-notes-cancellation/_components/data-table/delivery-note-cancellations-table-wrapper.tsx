import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getDeliveryNoteCancellations } from "../../_lib/queries";
import { DeliveryNoteCancellationsTable } from "./delivery-note-cancellations-table";
import type { SearchParams } from "@/types";

interface DeliveryNoteCancellationsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function DeliveryNoteCancellationsTableWrapper({ searchParams }: DeliveryNoteCancellationsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getDeliveryNoteCancellations({
    ...search,
    filters: validFilters,
  });

  return <DeliveryNoteCancellationsTable promises={promises} />
}

