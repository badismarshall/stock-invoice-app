"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/shared/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/shared/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/shared/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import type { DataTableRowAction, QueryKeys } from "@/types/data-table";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";
import type { getExportInvoices } from "../../_lib/queries";
import { ExportInvoicesTableActionBar } from "./export-invoices-table-action-bar";
import { getExportInvoicesTableColumns } from "./export-invoices-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeleteExportInvoiceDialog } from "./delete-export-invoice-dialog";

interface ExportInvoicesTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getExportInvoices>>
  >;
  clients?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function ExportInvoicesTable({ promises, clients = [], queryKeys }: ExportInvoicesTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, pageCount } = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<InvoiceDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getExportInvoicesTableColumns({
        setRowAction,
        clients,
      }),
    [setRowAction, clients],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "invoiceDate", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={<ExportInvoicesTableActionBar table={table} />}
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
      {rowAction && rowAction.variant === "delete" && rowAction.row && (
        <DeleteExportInvoiceDialog
          open={rowAction.variant === "delete"}
          onOpenChange={(open) => {
            if (!open) {
              setRowAction(null);
            }
          }}
          invoice={rowAction.row.original}
          onSuccess={() => {
            setRowAction(null);
          }}
        />
      )}
    </>
  );
}

