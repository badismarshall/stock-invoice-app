"use client";

import type { Table } from "@tanstack/react-table";
import { Download, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
  "delete",
] as const;

type Action = (typeof actions)[number];

interface InvoicesTableActionBarProps {
  table: Table<InvoiceDTOItem>;
}

export function InvoicesTableActionBar({ table }: InvoicesTableActionBarProps) {
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

  const onInvoiceDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      // TODO: Implement delete invoices action
      toast.error("La suppression des factures n'est pas encore implémentée");
      // const { error } = await deleteInvoices({
      //   ids: rows.map((row) => row.original.id),
      // });

      // if (error) {
      //   toast.error(error);
      //   return;
      // }
      // toast.success("Factures supprimées");
      // table.toggleAllRowsSelected(false);
    });
  }, [rows, table]);

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
          tooltip="Exporter les factures"
          isPending={getIsActionPending("export")}
          onClick={onInvoiceExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Supprimer les factures"
          isPending={getIsActionPending("delete")}
          onClick={onInvoiceDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}

