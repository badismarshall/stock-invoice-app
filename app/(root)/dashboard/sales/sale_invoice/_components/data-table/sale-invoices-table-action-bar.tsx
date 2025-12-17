"use client";

import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import * as React from "react";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/shared/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { exportTableToCSV } from "@/lib/data-table/export";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";

const actions = [
  "export",
] as const;

type Action = (typeof actions)[number];

interface SaleInvoicesTableActionBarProps {
  table: Table<InvoiceDTOItem>;
}

export function SaleInvoicesTableActionBar({ table }: SaleInvoicesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onInvoiceExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <DataTableActionBarAction
          size="icon"
          tooltip="Exporter les factures de vente"
          isPending={getIsActionPending("export")}
          onClick={onInvoiceExport}
        >
          <Download />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}

