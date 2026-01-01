"use client";

import type { Table } from "@tanstack/react-table";
import { Download, Trash2 } from "lucide-react";
import * as React from "react";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/shared/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { exportTableToCSV } from "@/lib/data-table/export";
import type { DeliveryNoteCancellationDTOItem } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dto";
import type { DataTableRowAction } from "@/types/data-table";

interface DeliveryNoteCancellationsTableActionBarProps {
  table: Table<DeliveryNoteCancellationDTOItem>;
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<DeliveryNoteCancellationDTOItem> | null>
  >;
}

export function DeliveryNoteCancellationsTableActionBar({
  table,
  setRowAction,
}: DeliveryNoteCancellationsTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<"export" | null>(null);

  const getIsActionPending = React.useCallback(
    (action: "export") => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
      setCurrentAction(null);
    });
  }, [table]);

  const onDelete = React.useCallback(() => {
    if (rows.length === 0) return;
    
    // Set row action to trigger delete dialog
    const firstRow = rows[0];
    if (firstRow) {
      setRowAction({ row: firstRow, variant: "delete" });
    }
  }, [rows, setRowAction]);

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
          tooltip="Exporter les annulations sélectionnées"
          isPending={getIsActionPending("export")}
          onClick={onExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Supprimer les annulations sélectionnées"
          onClick={onDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}

