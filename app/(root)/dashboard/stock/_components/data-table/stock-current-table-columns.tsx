"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Package,
  Hash,
  TrendingUp,
  DollarSign,
  FolderTree,
} from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import type { StockCurrentDTOItem } from "@/data/stock/stock.dto";

const translations = {
  productCode: "Code Produit",
  productName: "Produit",
  categoryName: "Catégorie",
  unitOfMeasure: "Unité",
  quantityAvailable: "Quantité Disponible",
  averageCost: "Coût Moyen",
  stockValue: "Valeur Stock",
  lastMovementDate: "Dernier Mouvement",
  lastUpdated: "Dernière Mise à Jour",
  lowStock: "Stock Faible",
  inStock: "En Stock",
};

interface GetStockCurrentTableColumnsProps {
  categories?: Array<{ id: string; name: string }>;
}

export function getStockCurrentTableColumns(
  props: GetStockCurrentTableColumnsProps = {}
): ColumnDef<StockCurrentDTOItem>[] {
  const { categories = [] } = props;
  return [
    {
      id: "productCode",
      accessorKey: "productCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.productCode} title={translations.productCode} />
      ),
      cell: ({ row }) => {
        const code = row.getValue<string | null>("productCode");
        return (
          <span className="max-w-125 truncate font-medium">
            {code || "-"}
          </span>
        );
      },
      meta: {
        label: translations.productCode,
        placeholder: "Rechercher un code...",
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "productName",
      accessorKey: "productName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.productName} title={translations.productName} />
      ),
      cell: ({ row }) => {
        const name = row.getValue<string | null>("productName");
        return (
          <span className="max-w-125 truncate">
            {name || "-"}
          </span>
        );
      },
      meta: {
        label: translations.productName,
        placeholder: "Rechercher un produit...",
        variant: "text",
        icon: Package,
      },
      enableColumnFilter: true,
    },
    {
      id: "categoryName",
      accessorKey: "categoryName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.categoryName} title={translations.categoryName} />
      ),
      cell: ({ row }) => {
        const category = row.getValue<string | null>("categoryName");
        return (
          <span className="max-w-125 truncate">
            {category || "-"}
          </span>
        );
      },
      meta: {
        label: translations.categoryName,
        variant: "multiSelect",
        options: categories.map((cat) => ({
          label: cat.name,
          value: cat.id,
          count: 0, // Counts would need to be fetched separately if needed
          icon: FolderTree,
        })),
      },
      enableColumnFilter: true,
    },
    {
      id: "unitOfMeasure",
      accessorKey: "unitOfMeasure",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.unitOfMeasure} title={translations.unitOfMeasure} />
      ),
      cell: ({ row }) => {
        const unit = row.getValue<string | null>("unitOfMeasure");
        return (
          <span className="max-w-125 truncate text-muted-foreground">
            {unit || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "quantityAvailable",
      accessorKey: "quantityAvailable",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.quantityAvailable} title={translations.quantityAvailable} />
      ),
      cell: ({ row }) => {
        const quantity = row.getValue<number>("quantityAvailable");
        const isLowStock = quantity <= 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`max-w-125 truncate font-medium ${isLowStock ? "text-destructive" : ""}`}>
              {quantity.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3,
              })}
            </span>
            {isLowStock && (
              <Badge variant="destructive" className="text-xs">
                {translations.lowStock}
              </Badge>
            )}
          </div>
        );
      },
      meta: {
        label: translations.quantityAvailable,
        variant: "number",
        icon: Package,
      },
      enableColumnFilter: true,
    },
    {
      id: "averageCost",
      accessorKey: "averageCost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.averageCost} title={translations.averageCost} />
      ),
      cell: ({ row }) => {
        const cost = row.getValue<number>("averageCost");
        return (
          <span className="max-w-125 truncate">
            {cost.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "stockValue",
      accessorKey: "stockValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.stockValue} title={translations.stockValue} />
      ),
      cell: ({ row }) => {
        const value = row.getValue<number>("stockValue");
        return (
          <span className="max-w-125 truncate font-semibold">
            {value.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        );
      },
      meta: {
        label: translations.stockValue,
        variant: "number",
        icon: DollarSign,
      },
      enableColumnFilter: false,
    },
    {
      id: "lastMovementDate",
      accessorKey: "lastMovementDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.lastMovementDate} title={translations.lastMovementDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date | null>("lastMovementDate");
        return date ? formatDate(date) : "-";
      },
      meta: {
        label: translations.lastMovementDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "lastUpdated",
      accessorKey: "lastUpdated",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.lastUpdated} title={translations.lastUpdated} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
      meta: {
        label: translations.lastUpdated,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
  ];
}

