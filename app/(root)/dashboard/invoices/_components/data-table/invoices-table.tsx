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
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";
import type { getInvoices } from "../../_lib/queries";
import { InvoicesTableActionBar } from "./invoices-table-action-bar";
import { getInvoicesTableColumns } from "./invoices-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DataTableBodySkeleton } from "@/components/shared/data-table/data-table-body-skeleton";
import { ExportInvoicesButtons } from "./export-invoices-buttons";

interface InvoicesTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getInvoices>>
  >;
  clients?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
  hideSupplierFilter?: boolean;
  hideInvoiceTypeFilter?: boolean;
  hideSupplierColumn?: boolean;
  hideClientColumn?: boolean;
  hideClientFilter?: boolean;
}

export function InvoicesTable({ promises, clients = [], suppliers = [], queryKeys, hideSupplierFilter = false, hideInvoiceTypeFilter = false, hideSupplierColumn = false, hideClientColumn = false, hideClientFilter = false }: InvoicesTableProps) {
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
    React.useState<DataTableRowAction<InvoiceDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getInvoicesTableColumns({
        setRowAction,
        clients,
        suppliers,
        hideSupplierFilter,
        hideInvoiceTypeFilter,
        hideClientFilter,
      }),
    [setRowAction, clients, suppliers, hideSupplierFilter, hideInvoiceTypeFilter, hideClientFilter],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "invoiceDate", desc: true }],
      columnPinning: { right: ["actions"] },
      columnVisibility: {
        createdByName: false,
        createdAt: false,
        ...(hideSupplierColumn && { supplierId: false }),
        ...(hideClientColumn && { clientId: false }),
      },
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
        actionBar={<InvoicesTableActionBar table={table} />}
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
            <ExportInvoicesButtons />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
            <ExportInvoicesButtons />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
}

