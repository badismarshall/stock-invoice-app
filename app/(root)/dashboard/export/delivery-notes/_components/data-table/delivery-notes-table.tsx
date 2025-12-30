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
import type { DeliveryNoteDTOItem } from "@/data/delivery-note/delivery-note.dto";
import type { getDeliveryNotes } from "../../_lib/queries";
import { DeliveryNotesTableActionBar } from "./delivery-notes-table-action-bar";
import { getDeliveryNotesTableColumns } from "./delivery-notes-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeleteDeliveryNotesDialog } from "./delete-delivery-notes-dialog";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";

interface DeliveryNotesTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getDeliveryNotes>>
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function DeliveryNotesTable({ promises, queryKeys }: DeliveryNotesTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const { showLoading, startTransition, resetLoading } = useTableLoading();

  const { data, pageCount, invoices } = React.use(promises);

  // Reset loading when data is received
  React.useEffect(() => {
    if (data) {
      resetLoading();
    }
  }, [data, resetLoading]);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<DeliveryNoteDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getDeliveryNotesTableColumns({
        setRowAction,
        invoices: invoices || {},
      }),
    [setRowAction, invoices],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "noteDate", desc: true }],
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
        actionBar={<DeliveryNotesTableActionBar table={table} />}
        renderTableBody={
          showLoading
            ? () => (
                <DataTableBodySkeleton
                  columnCount={8}
                  rowCount={10}
                  cellWidths={[
                    "10rem",
                    "15rem",
                    "12rem",
                    "12rem",
                    "12rem",
                    "12rem",
                    "12rem",
                    "6rem",
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
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
      <DeleteDeliveryNotesDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        deliveryNotes={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
    </>
  );
}

