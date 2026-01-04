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
import type { CategoryDTOItem } from "@/data/category/category.dto";
import type { getCategories } from "../../_lib/queries";
import { CategoryTableActionBar } from "./category-table-action-bar";
import { getCategoryTableColumns } from "./category-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeleteCategoriesDialog } from "./delete-categories-dialog";
import { UpdateCategoryDialog } from "./update-category-dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CategoryTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getCategories>>
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function CategoryTable({ promises, queryKeys }: CategoryTableProps) {
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
    React.useState<DataTableRowAction<CategoryDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getCategoryTableColumns({
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
            actionBar={<CategoryTableActionBar table={table} />}
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
        <UpdateCategoryDialog
          open={true}
          onOpenChange={() => setRowAction(null)}
          category={rowAction.row.original}
          onSuccess={() => {
            setRowAction(null);
          }}
        />
      )}
      <DeleteCategoriesDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        categories={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
    </>
  );
}

