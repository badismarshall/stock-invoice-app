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
import type { State104DTOItem } from "@/data/state104/state104.dto";
import type { getState104 } from "../../_lib/queries";  
import { getState104TableColumns } from "./state104-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";
import { ExportState104Buttons } from "./export-state104-buttons";
import { State104TableActionBar } from "./state104-table-action-bar";

interface State104TableProps {
  promises: Promise<Awaited<ReturnType<typeof getState104>>>;
  clients?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function State104Table({ promises, clients = [], queryKeys }: State104TableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const { showLoading, startTransition, resetLoading } = useTableLoading();

  const { data, pageCount } = React.use(promises);

  React.useEffect(() => {
    if (data) {
      resetLoading();
    }
  }, [data, resetLoading]);

  const columns = React.useMemo(
    () => getState104TableColumns({ clients }),
    [clients],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "clientName", desc: false }],
      columnPinning: { right: [] },
      columnVisibility: { date: false },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.clientId,
    shallow: false,
    clearOnDefault: true,
    startTransition,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={<State104TableActionBar table={table} />}
        renderTableBody={
          showLoading
            ? () => (
                <DataTableBodySkeleton
                  columnCount={7}
                  rowCount={10}
                  cellWidths={["3rem", "15rem", "15rem", "12rem", "12rem", "12rem", "12rem"]}
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
            <ExportState104Buttons />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
            <ExportState104Buttons />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
}
