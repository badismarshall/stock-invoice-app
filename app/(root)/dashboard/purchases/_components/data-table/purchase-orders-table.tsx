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
import type { PurchaseOrderDTOItem } from "@/data/purchase-order/purchase-order.dto";
import type { getPurchaseOrders } from "../../_lib/queries";
import { PurchaseOrdersTableActionBar } from "./purchase-orders-table-action-bar";
import { getPurchaseOrdersTableColumns } from "./purchase-orders-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeletePurchaseOrdersDialog } from "./delete-purchase-orders-dialog";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";

interface PurchaseOrdersTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getPurchaseOrders>>
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function PurchaseOrdersTable({ promises, queryKeys }: PurchaseOrdersTableProps) {
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
    React.useState<DataTableRowAction<PurchaseOrderDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getPurchaseOrdersTableColumns({
        setRowAction,
      }),
    [setRowAction],
  );

  // Always call useDataTable hook (React rules)
  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
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
        actionBar={<PurchaseOrdersTableActionBar table={table} />}
        renderTableBody={
          showLoading
            ? () => (
                <DataTableBodySkeleton
                  columnCount={9}
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
      <DeletePurchaseOrdersDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        purchaseOrders={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
    </>
  );
}

