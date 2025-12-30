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
import type { StockCurrentDTOItem } from "@/data/stock/stock.dto";
import type { getStockCurrentQuery } from "../../_lib/queries";
import { useFeatureFlags } from "../../../_components/feature-flags-provider";
import { getStockCurrentTableColumns } from "./stock-current-table-columns";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface StockCurrentTableProps {
  promises: Promise<Awaited<ReturnType<typeof getStockCurrentQuery>>>;
  queryKeys?: Partial<QueryKeys>;
  categories?: Array<{ id: string; name: string }>;
}

export function StockCurrentTable({ promises, queryKeys, categories }: StockCurrentTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const { showLoading, startTransition, resetLoading } = useTableLoading();

  const { data: stock, pageCount, summary } = React.use(promises);

  // Reset loading when data is received
  React.useEffect(() => {
    if (stock) {
      resetLoading();
    }
  }, [stock, resetLoading]);

  const columns = React.useMemo(
    () => getStockCurrentTableColumns({ categories }),
    [categories]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: stock,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "lastUpdated", desc: true }],
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
    startTransition,
  });

  return (
    <div className="relative">
      {/* Simple loading overlay */}
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
  );
}

