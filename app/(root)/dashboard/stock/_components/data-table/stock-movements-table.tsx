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
import type { StockMovementDTOItem } from "@/data/stock/stock.dto";
import type { getStockMovementsQuery } from "../../_lib/queries";
import { useFeatureFlags } from "../../../_components/feature-flags-provider";
import { getStockMovementsTableColumns } from "./stock-movements-table-columns";

interface StockMovementsTableProps {
  promises: Promise<Awaited<ReturnType<typeof getStockMovementsQuery>>>;
  queryKeys?: Partial<QueryKeys>;
}

export function StockMovementsTable({ promises, queryKeys }: StockMovementsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data: movements, pageCount } = React.use(promises);

  const columns = React.useMemo(
    () => getStockMovementsTableColumns(),
    []
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: movements,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "movementDate", desc: true }],
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

