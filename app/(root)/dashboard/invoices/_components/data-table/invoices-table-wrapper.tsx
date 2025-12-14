import { SearchParams } from "@/types"
import { searchParamsCache } from "../../_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getInvoicesQuery } from "../../_lib/queries"
import { InvoicesTable } from "./invoices-table"

interface InvoicesTableWrapperProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function InvoicesTableWrapper({ searchParams }: InvoicesTableWrapperProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  const validFilters = getValidFilters(search.filters);

  const promises = getInvoicesQuery({
    ...search,
    filters: validFilters,
  });

  return <InvoicesTable promises={promises} />
}

