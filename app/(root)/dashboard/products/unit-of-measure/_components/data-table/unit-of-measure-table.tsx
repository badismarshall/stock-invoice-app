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
import type { UnitOfMeasureDTOItem } from "@/data/unit-of-measure/unit-of-measure.dto";
import type { getUnitsOfMeasure } from "../../_lib/queries";
import { UnitOfMeasureTableActionBar } from "./unit-of-measure-table-action-bar";
import { getUnitOfMeasureTableColumns } from "./unit-of-measure-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeleteUnitsOfMeasureDialog } from "./delete-units-of-measure-dialog";
import { UpdateUnitOfMeasureDialog } from "./update-unit-of-measure-dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface UnitOfMeasureTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getUnitsOfMeasure>>
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function UnitOfMeasureTable({ promises, queryKeys }: UnitOfMeasureTableProps) {
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
    React.useState<DataTableRowAction<UnitOfMeasureDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getUnitOfMeasureTableColumns({
        setRowAction,
      }),
    [],
  );

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
      <div className="relative">
        {showLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Chargement...</p>
            </div>
          </div>
        )}
        <div className={cn(showLoading && "opacity-50 pointer-events-none")}>
          <DataTable
            table={table}
            actionBar={<UnitOfMeasureTableActionBar table={table} />}
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
        </div>
      </div>
      {rowAction?.variant === "update" && rowAction.row.original && (
        <UpdateUnitOfMeasureDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          unitOfMeasure={rowAction.row.original}
          onSuccess={() => {
            setRowAction(null);
          }}
        />
      )}
      <DeleteUnitsOfMeasureDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        unitsOfMeasure={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
    </>
  );
}

