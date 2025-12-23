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
import type { getProformaInvoices } from "../../_lib/queries";
import { ProformaInvoicesTableActionBar } from "./proforma-invoices-table-action-bar";
import { getProformaInvoicesTableColumns } from "./proforma-invoices-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";
import { DeleteProformaInvoiceDialog } from "./delete-proforma-invoice-dialog";

interface ProformaInvoicesTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getProformaInvoices>>
  >;
  clients?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function ProformaInvoicesTable({ promises, clients = [], queryKeys }: ProformaInvoicesTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, pageCount } = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<InvoiceDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getProformaInvoicesTableColumns({
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
        actionBar={<ProformaInvoicesTableActionBar table={table} />}
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
        <DeleteProformaInvoiceDialog
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

