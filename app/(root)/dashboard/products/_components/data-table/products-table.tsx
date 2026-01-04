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
import type { ProductDTOItem } from "@/data/product/product.dto";
import type { getProducts } from "../../_lib/queries";
import { ProductsTableActionBar } from "./products-table-action-bar";
import { getProductsTableColumns } from "./products-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeleteProductsDialog } from "./delete-products-dialog";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";
import { ExportProductsButtons } from "./export-products-buttons";

interface ProductsTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getProducts>>
  >;
  categories?: Array<{ id: string; name: string }>;
  unitsOfMeasure?: Array<{ id: string; name: string; symbol: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function ProductsTable({ promises, categories = [], unitsOfMeasure = [], queryKeys }: ProductsTableProps) {
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
    React.useState<DataTableRowAction<ProductDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getProductsTableColumns({
        setRowAction,
        categories,
        unitsOfMeasure,
      }),
    [setRowAction, categories, unitsOfMeasure],
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
      <DataTable
        table={table}
        actionBar={<ProductsTableActionBar table={table} />}
        renderTableBody={
          showLoading
            ? () => (
                <DataTableBodySkeleton
                  columnCount={9}
                  rowCount={10}
                  cellWidths={[
                    "10rem",
                    "20rem",
                    "15rem",
                    "10rem",
                    "10rem",
                    "10rem",
                    "10rem",
                    "10rem",
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
            <ExportProductsButtons />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
            <ExportProductsButtons />
          </DataTableToolbar>
        )}
      </DataTable>
      <DeleteProductsDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        products={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
    </>
  );
}

