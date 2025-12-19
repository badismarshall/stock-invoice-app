"use client";

import type { Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/shared/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";

interface CancellationItem {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  noteNumber: string;
  cancelledQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DeleteCancellationItemsActionBarProps {
  table: Table<CancellationItem>;
  cancellationId: string;
  onDeleteItems: (itemIds: string[]) => Promise<void>;
  onDeleteAll: () => void;
  isDeleting: boolean;
}

export function DeleteCancellationItemsActionBar({
  table,
  cancellationId,
  onDeleteItems,
  onDeleteAll,
  isDeleting,
}: DeleteCancellationItemsActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();

  const onDeleteSelected = React.useCallback(() => {
    if (rows.length === 0) return;

    startTransition(async () => {
      const itemIds = rows.map((row) => row.original.id);
      await onDeleteItems(itemIds);
      table.toggleAllRowsSelected(false);
    });
  }, [rows, onDeleteItems, table]);

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
          tooltip="Supprimer les articles sélectionnés"
          isPending={isPending || isDeleting}
          onClick={onDeleteSelected}
        >
          <Trash2 />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="default"
          tooltip="Supprimer toute l'annulation"
          isPending={isPending || isDeleting}
          onClick={onDeleteAll}
          className="h-7 px-3"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Supprimer tout
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}





