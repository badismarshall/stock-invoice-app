"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Package,
  Hash,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Badge as BadgeIcon,
  Ellipsis,
} from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/data-table/format";
import type { StockMovementDTOItem } from "@/data/stock/stock.dto";
import type { Row } from "@tanstack/react-table";

interface GetStockMovementsTableColumnsProps {
  setRowAction?: (action: { row: Row<StockMovementDTOItem>; variant: "delete" }) => void;
}

const translations = {
  productCode: "Code Produit",
  productName: "Produit",
  movementType: "Type",
  movementSource: "Source",
  quantity: "Quantité",
  unitCost: "Coût Unitaire",
  totalCost: "Coût Total",
  movementDate: "Date Mouvement",
  referenceType: "Type de Référence",
  referenceId: "ID de Référence",
  notes: "Notes",
  createdBy: "Créé par",
  createdAt: "Créé le",
  in: "Entrée",
  out: "Sortie",
  adjustment: "Ajustement",
  purchase: "Achat",
  sale_local: "Vente Locale",
  sale_export: "Vente Export",
  delivery_note: "Bon de Livraison",
  return: "Retour",
  edit: "Modifier",
  delete: "Supprimer",
  actions: "Actions",
};

// Mapping pour traduire les types de référence en français
const referenceTypeTranslations: Record<string, string> = {
  purchase_order: "Bon de Commande",
  invoice: "Facture",
  delivery_note: "Bon de Livraison",
  adjustment: "Ajustement",
  return: "Retour",
};

const movementTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof ArrowUp }> = {
  in: { label: translations.in, variant: "default", icon: ArrowDown },
  out: { label: translations.out, variant: "destructive", icon: ArrowUp },
  adjustment: { label: translations.adjustment, variant: "outline", icon: RotateCcw },
};

const movementSourceConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  purchase: { label: translations.purchase, variant: "default" },
  sale_local: { label: translations.sale_local, variant: "secondary" },
  sale_export: { label: translations.sale_export, variant: "secondary" },
  delivery_note: { label: translations.delivery_note, variant: "outline" },
  adjustment: { label: translations.adjustment, variant: "outline" },
  return: { label: translations.return, variant: "outline" },
};

export function getStockMovementsTableColumns({
  setRowAction,
}: GetStockMovementsTableColumnsProps = {}): ColumnDef<StockMovementDTOItem>[] {
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
      id: "movementType",
      accessorKey: "movementType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.movementType} title={translations.movementType} />
      ),
      cell: ({ row }) => {
        const type = row.getValue<string>("movementType");
        const config = movementTypeConfig[type] || { label: type, variant: "outline" as const, icon: ArrowUp };
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: translations.movementType,
        variant: "multiSelect",
        options: [
          { label: translations.in, value: "in", count: 0, icon: ArrowDown },
          { label: translations.out, value: "out", count: 0, icon: ArrowUp },
          { label: translations.adjustment, value: "adjustment", count: 0, icon: RotateCcw },
        ],
        icon: BadgeIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "movementSource",
      accessorKey: "movementSource",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.movementSource} title={translations.movementSource} />
      ),
      cell: ({ row }) => {
        const source = row.getValue<string>("movementSource");
        const config = movementSourceConfig[source] || { label: source, variant: "outline" as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: translations.movementSource,
        variant: "multiSelect",
        options: [
          { label: translations.purchase, value: "purchase", count: 0 },
          { label: translations.sale_local, value: "sale_local", count: 0 },
          { label: translations.sale_export, value: "sale_export", count: 0 },
          { label: translations.delivery_note, value: "delivery_note", count: 0 },
          { label: translations.adjustment, value: "adjustment", count: 0 },
          { label: translations.return, value: "return", count: 0 },
        ],
        icon: BadgeIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.quantity} title={translations.quantity} />
      ),
      cell: ({ row }) => {
        const quantity = row.getValue<number>("quantity");
        const movementType = row.original.movementType;
        const isOut = movementType === "out";
        return (
          <span className={`max-w-125 truncate font-medium ${isOut ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
            {isOut ? "-" : "+"}{quantity.toLocaleString("fr-FR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 3,
            })}
          </span>
        );
      },
      meta: {
        label: translations.quantity,
        variant: "number",
        icon: Package,
      },
      enableColumnFilter: true,
    },
    {
      id: "unitCost",
      accessorKey: "unitCost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.unitCost} title={translations.unitCost} />
      ),
      cell: ({ row }) => {
        const cost = row.getValue<number | null>("unitCost");
        return (
          <span className="max-w-125 truncate">
            {cost !== null
              ? cost.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "DZD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "totalCost",
      accessorKey: "totalCost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.totalCost} title={translations.totalCost} />
      ),
      cell: ({ row }) => {
        const cost = row.getValue<number | null>("totalCost");
        return (
          <span className="max-w-125 truncate font-semibold">
            {cost !== null
              ? cost.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "DZD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "movementDate",
      accessorKey: "movementDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.movementDate} title={translations.movementDate} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
      meta: {
        label: translations.movementDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "referenceType",
      accessorKey: "referenceType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.referenceType} title={translations.referenceType} />
      ),
      cell: ({ row }) => {
        const refType = row.getValue<string | null>("referenceType");
        const refId = row.original.referenceId;
        const translatedType = refType ? (referenceTypeTranslations[refType] || refType) : null;
        return (
          <span className="max-w-125 truncate text-muted-foreground">
            {translatedType ? `${translatedType}${refId ? ` #${refId}` : ""}` : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
      enableHiding: true,
    },
    {
      id: "createdByName",
      accessorKey: "createdByName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.createdBy} title={translations.createdBy} />
      ),
      cell: ({ row }) => {
        const name = row.getValue<string | null>("createdByName");
        return (
          <span className="max-w-125 truncate">
            {name || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.createdAt} title={translations.createdAt} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
      meta: {
        label: translations.createdAt,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const router = useRouter();
        const movement = row.original;
        // Afficher les actions uniquement pour les mouvements d'ajustement
        if (movement.movementSource !== "adjustment") {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Ouvrir le menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => router.push(`/dashboard/stock/movement/modify/${movement.id}`)}
              >
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction?.({ row, variant: "delete" })}
                className="text-destructive"
              >
                {translations.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
      enableHiding: false,
    },
  ];
}

