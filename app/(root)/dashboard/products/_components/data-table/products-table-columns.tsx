"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  Text,
  Hash,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import type { DataTableRowAction } from "@/types/data-table";
import type { ProductDTOItem } from "@/data/product/product.dto";

interface GetProductsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<ProductDTOItem> | null>
  >;
}

const translations = {
  code: "Code",
  searchCode: "Rechercher un code...",
  name: "Nom",
  searchNames: "Rechercher un produit...",
  category: "Catégorie",
  unitOfMeasure: "Unité",
  purchasePrice: "Prix d'achat",
  salePriceLocal: "Prix vente local",
  salePriceExport: "Prix vente export",
  taxRate: "TVA (%)",
  isActive: "Statut",
  active: "Active",
  inactive: "Inactive",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
};

export function getProductsTableColumns({
  setRowAction,
}: GetProductsTableColumnsProps): ColumnDef<ProductDTOItem>[] {
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
      id: "code",
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.code} title={translations.code} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("code")}
          </span>
        );
      },
      meta: {
        label: translations.code,
        placeholder: translations.searchCode,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.name} title={translations.name} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("name")}
          </span>
        );
      },
      meta: {
        label: translations.name,
        placeholder: translations.searchNames,
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "categoryName",
      accessorKey: "categoryName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.category} title={translations.category} />
      ),
      cell: ({ row }) => {
        const categoryName = row.getValue<string | null>("categoryName");
        return (
          <span className="max-w-125 truncate">
            {categoryName || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "unitOfMeasure",
      accessorKey: "unitOfMeasure",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.unitOfMeasure} title={translations.unitOfMeasure} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate">
            {row.getValue("unitOfMeasure")}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "purchasePrice",
      accessorKey: "purchasePrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.purchasePrice} title={translations.purchasePrice} />
      ),
      cell: ({ row }) => {
        const price = row.getValue<string | null>("purchasePrice");
        const priceValue = price ? parseFloat(price) : 0;
        return (
          <span className="max-w-125 truncate">
            {priceValue.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
            })}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "salePriceLocal",
      accessorKey: "salePriceLocal",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.salePriceLocal} title={translations.salePriceLocal} />
      ),
      cell: ({ row }) => {
        const price = row.getValue<string | null>("salePriceLocal");
        const priceValue = price ? parseFloat(price) : 0;
        return (
          <span className="max-w-125 truncate font-medium">
            {priceValue.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
            })}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.isActive} title={translations.isActive} />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>("isActive");
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? (
              <>
                <CheckCircle2 className="mr-1 size-3" />
                {translations.active}
              </>
            ) : (
              <>
                <XCircle className="mr-1 size-3" />
                {translations.inactive}
              </>
            )}
          </Badge>
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
                onSelect={() => router.push(`/dashboard/products/modify/${row.original.id}`)}
              >
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                {translations.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}

