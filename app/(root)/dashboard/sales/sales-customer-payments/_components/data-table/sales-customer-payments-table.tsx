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
import type { QueryKeys } from "@/types/data-table";
import type { SalesCustomerPaymentDTOItem } from "@/data/sales-customer-payment/sales-customer-payment.dto";
import type { getSalesCustomerPayments } from "../../_lib/queries";
import { SalesCustomerPaymentsTableActionBar } from "./sales-customer-payments-table-action-bar";
import { getSalesCustomerPaymentsTableColumns } from "./sales-customer-payments-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";
import { ExportSalesCustomerPaymentsButtons } from "./export-sales-customer-payments-buttons";

interface SalesCustomerPaymentsTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getSalesCustomerPayments>>
  >;
  clients?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function SalesCustomerPaymentsTable({ promises, clients = [], queryKeys }: SalesCustomerPaymentsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const { showLoading, startTransition, resetLoading } = useTableLoading();

  const { data, pageCount } = React.use(promises);

  // Reset loading when data is received
  React.useEffect(() => {
    if (data) {
      resetLoading();
    }
  }, [data, resetLoading]);

  const columns = React.useMemo(
    () =>
      getSalesCustomerPaymentsTableColumns({
        clients,
      }),
    [clients],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "date", desc: true }],
      columnPinning: { right: [] },
      columnVisibility: {},
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
        actionBar={<SalesCustomerPaymentsTableActionBar table={table} />}
        renderTableBody={
          showLoading
            ? () => (
                <DataTableBodySkeleton
                  columnCount={8}
                  rowCount={10}
                  cellWidths={[
                    "3rem",
                    "10rem",
                    "15rem",
                    "12rem",
                    "12rem",
                    "12rem",
                    "12rem",
                    "12rem",
                  ]}
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
            <ExportSalesCustomerPaymentsButtons />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
            <ExportSalesCustomerPaymentsButtons />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
}

