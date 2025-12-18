import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getPayments } from "../../_lib/queries";
import { PaymentsTable } from "./payments-table";
import { getAllClients } from "../../../invoices/_lib/actions";
import { getAllSuppliers } from "../../../purchases/_lib/actions";
import type { SearchParams } from "@/types";

interface PaymentsTableWrapperProps {
  searchParams: Promise<SearchParams>;
}

export async function PaymentsTableWrapper({ searchParams }: PaymentsTableWrapperProps) {
  const searchParamsResolved = await searchParams;
  const search = searchParamsCache.parse(searchParamsResolved);

  const validFilters = getValidFilters(search.filters);

  const [clientsResult, suppliersResult] = await Promise.all([
    getAllClients(),
    getAllSuppliers(),
  ]);
  const clients = clientsResult.data || [];
  const suppliers = suppliersResult.data || [];

  const promises = getPayments({
    ...search,
    filters: validFilters,
  });

  return <PaymentsTable promises={promises} clients={clients} suppliers={suppliers} />
}

