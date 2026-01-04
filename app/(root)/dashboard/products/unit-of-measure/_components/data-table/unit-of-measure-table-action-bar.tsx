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
import type { UnitOfMeasureDTOItem } from "@/data/unit-of-measure/unit-of-measure.dto";
import { deleteUnitsOfMeasure } from "../../_lib/actions";

const actions = [
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface UnitOfMeasureTableActionBarProps {
  table: Table<UnitOfMeasureDTOItem>;
}

export function UnitOfMeasureTableActionBar({ table }: UnitOfMeasureTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onUnitOfMeasureExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  const onUnitOfMeasureDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteUnitsOfMeasure({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Unités de mesure supprimées");
      table.toggleAllRowsSelected(false);
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
          tooltip="Exporter les unités de mesure"
          isPending={getIsActionPending("export")}
          onClick={onUnitOfMeasureExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip="Supprimer les unités de mesure"
          isPending={getIsActionPending("delete")}
          onClick={onUnitOfMeasureDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}

