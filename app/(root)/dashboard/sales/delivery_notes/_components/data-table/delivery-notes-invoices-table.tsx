"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/shared/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/shared/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/shared/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import type { DataTableRowAction, QueryKeys } from "@/types/data-table";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";
import type { getDeliveryNotesInvoices } from "../../_lib/queries";
import { DeliveryNotesInvoicesTableActionBar } from "./delivery-notes-invoices-table-action-bar";
import { getDeliveryNotesInvoicesTableColumns } from "./delivery-notes-invoices-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";

interface DeliveryNotesInvoicesTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getDeliveryNotesInvoices>>
  >;
  clients?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function DeliveryNotesInvoicesTable({ promises, clients = [], queryKeys }: DeliveryNotesInvoicesTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, pageCount } = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<InvoiceDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getDeliveryNotesInvoicesTableColumns({
        setRowAction,
        clients,
      }),
    [setRowAction, clients],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "invoiceDate", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={<DeliveryNotesInvoicesTableActionBar table={table} />}
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
    </>
  );
}

