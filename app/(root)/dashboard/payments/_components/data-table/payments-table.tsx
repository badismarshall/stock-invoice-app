"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/shared/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/shared/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/shared/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import { useTableLoading } from "@/hooks/data-table/use-table-loading";
import type { DataTableRowAction, QueryKeys } from "@/types/data-table";
import type { PaymentDTOItem } from "@/data/payment/payment.dto";
import type { getPayments } from "../../_lib/queries";
import { PaymentsTableActionBar } from "./payments-table-action-bar";
import { getPaymentsTableColumns } from "./payments-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";

interface PaymentsTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getPayments>>
  >;
  clients?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function PaymentsTable({ promises, clients = [], suppliers = [], queryKeys }: PaymentsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const { showLoading, startTransition, resetLoading } = useTableLoading();

  const { data, pageCount } = React.use(promises);

  // Reset loading when data is received
  React.useEffect(() => {
    if (data) {
      resetLoading();
    }
  }, [data, resetLoading]);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<PaymentDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getPaymentsTableColumns({
        setRowAction,
        clients,
        suppliers,
      }),
    [setRowAction, clients, suppliers],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "paymentDate", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
    startTransition,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={<PaymentsTableActionBar table={table} />}
        renderTableBody={
          showLoading
            ? () => (
                <DataTableBodySkeleton
                  columnCount={10}
                  rowCount={10}
                  shrinkZero
                />
              )
            : undefined
        }
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

