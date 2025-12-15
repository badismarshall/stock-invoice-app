import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getDeliveryNotes } from "../../_lib/queries";
import { DeliveryNotesTable } from "./delivery-notes-table";
import type { SearchParams } from "@/types";

interface DeliveryNotesTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function DeliveryNotesTableWrapper({ searchParams }: DeliveryNotesTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const promises = getDeliveryNotes({
    ...search,
    filters: validFilters,
    noteType: ["export"], // Only show export delivery notes
  });

  return <DeliveryNotesTable promises={promises} />
}


