"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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

const translations = {
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  noteNumber: "N° BL",
  product: "Produit",
  quantity: "Quantité",
  unitPrice: "Prix unitaire",
  lineTotal: "Total ligne",
  actions: "Actions",
};

export function getDeleteCancellationItemsTableColumns({
  onDeleteItem,
  isDeleting,
}: {
  onDeleteItem: (item: CancellationItem) => void;
  isDeleting: boolean;
}): ColumnDef<CancellationItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={translations.selectAll}
          className="translate-y-0.5"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={translations.selectRow}
          className="translate-y-0.5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "noteNumber",
      accessorKey: "noteNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.noteNumber} title={translations.noteNumber} />
      ),
      cell: ({ row }) => {
        return (
          <span className="font-medium">
            {row.getValue("noteNumber")}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: "product",
      accessorKey: "productName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.product} title={translations.product} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <div className="font-medium">{item.productName || "-"}</div>
            {item.productCode && (
              <div className="text-xs text-muted-foreground">
                {item.productCode}
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "cancelledQuantity",
      accessorKey: "cancelledQuantity",
      header: ({ column }) => (
        <div className="flex justify-end">
          <DataTableColumnHeader column={column} label={translations.quantity} title={translations.quantity} />
        </div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium">
            {row.getValue<number>("cancelledQuantity").toFixed(3)}
          </div>
        );
      },
      enableSorting: true,
      meta: {
        align: "right",
      },
    },
    {
      id: "unitPrice",
      accessorKey: "unitPrice",
      header: ({ column }) => (
        <div className="flex justify-end">
          <DataTableColumnHeader column={column} label={translations.unitPrice} title={translations.unitPrice} />
        </div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium">
            {row.getValue<number>("unitPrice").toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} DZD
          </div>
        );
      },
      enableSorting: true,
      meta: {
        align: "right",
      },
    },
    {
      id: "lineTotal",
      accessorKey: "lineTotal",
      header: ({ column }) => (
        <div className="flex justify-end">
          <DataTableColumnHeader column={column} label={translations.lineTotal} title={translations.lineTotal} />
        </div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-medium">
            {row.getValue<number>("lineTotal").toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} DZD
          </div>
        );
      },
      enableSorting: true,
      meta: {
        align: "right",
      },
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const item = row.original;

        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteItem(item)}
              disabled={isDeleting}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
      size: 80,
      enableHiding: false,
    },
  ];
}

