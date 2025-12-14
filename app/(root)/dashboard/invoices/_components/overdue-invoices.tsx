import { InvoicesTableWrapper } from "./data-table/invoices-table-wrapper"
import { searchParamsCache } from "../_lib/validation"

interface OverdueInvoicesProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function OverdueInvoices({ searchParams }: OverdueInvoicesProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  
  // Filter for overdue invoices (we'll handle this in the DAL or add a filter)
  // For now, we'll show unpaid invoices and let the table show overdue badge
  const modifiedSearchParams = {
    ...resolvedSearchParams,
    paymentStatus: ["unpaid", "partially_paid"],
  };

  return <InvoicesTableWrapper searchParams={Promise.resolve(modifiedSearchParams)} />
}

