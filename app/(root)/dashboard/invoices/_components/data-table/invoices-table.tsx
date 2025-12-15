"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/shared/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/shared/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/shared/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";
import type { getInvoicesQuery } from "../../_lib/queries";
import { useFeatureFlags } from "../../../_components/feature-flags-provider";
import { getInvoicesTableColumns } from "./invoices-table-columns";

interface InvoicesTableProps {
  promises: Promise<Awaited<ReturnType<typeof getInvoicesQuery>>>;
  queryKeys?: Partial<QueryKeys>;
}

export function InvoicesTable({ promises, queryKeys }: InvoicesTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data: invoices, pageCount } = React.use(promises);

  const columns = React.useMemo(
    () => getInvoicesTableColumns(),
    []
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: invoices,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable
      table={table}
    >
      {enableAdvancedFilter ? (
        <DataTableAdvancedToolbar table={table}>
          <DataTableSortList table={table} align="start" />
          {filterFlag === "advancedFilters" ? (
            <DataTableFilterList
              table={table}
              shallow={shallow}
              debounceMs={debounceMs}
              throttleMs={throttleMs}
              align="start"
            />
          ) : (
            <DataTableFilterMenu
              table={table}
              shallow={shallow}
              debounceMs={debounceMs}
              throttleMs={throttleMs}
            />
          )}
        </DataTableAdvancedToolbar>
      ) : (
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      )}
    </DataTable>
  );
}

