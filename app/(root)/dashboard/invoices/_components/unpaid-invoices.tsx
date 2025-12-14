import { InvoicesTableWrapper } from "./data-table/invoices-table-wrapper"
import { searchParamsCache } from "../_lib/validation"

interface UnpaidInvoicesProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function UnpaidInvoices({ searchParams }: UnpaidInvoicesProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  
  // Override payment status to show only unpaid
  const modifiedSearchParams = {
    ...resolvedSearchParams,
    paymentStatus: ["unpaid"],
  };

  return <InvoicesTableWrapper searchParams={Promise.resolve(modifiedSearchParams)} />
}

