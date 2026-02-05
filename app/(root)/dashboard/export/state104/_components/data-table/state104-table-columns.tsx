"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, Building2, MapPin, Hash, FileText, DollarSign } from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import type { State104DTOItem } from "@/data/state104/state104.dto";

function formatCurrency(amount: string): string {
  const num = parseFloat(amount || "0");
  return num.toLocaleString("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface GetState104TableColumnsProps {
  clients?: Array<{ id: string; name: string }>;
}

const translations = {
  clientName: "Nom Client",
  address: "Adresse",
  nif: "NIF",
  rcs: "RCS",
  saleAmountHT: "Chiffre d'affaires H.T",
  saleAmountTTC: "Chiffre d'affaires TTC",
  totalTva: "Totale TVA",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  date: "Date",
};

export function getState104TableColumns({
  clients = [],
}: GetState104TableColumnsProps): ColumnDef<State104DTOItem>[] {
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
      id: "date",
      accessorKey: "date",
      header: () => null,
      cell: () => null,
      meta: {
        label: translations.date,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "clientId",
      accessorKey: "clientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.clientName} title={translations.clientName} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate font-medium">
          {row.original.clientName || "-"}
        </span>
      ),
      meta: {
        label: translations.clientName,
        variant: "multiSelect",
        options: clients.map((c) => ({ label: c.name, value: c.id, count: 0 })),
        icon: Building2,
      },
      enableColumnFilter: true,
    },
    {
      id: "address",
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.address} title={translations.address} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate">
          {row.original.address || "-"}
        </span>
      ),
      meta: {
        label: translations.address,
        variant: "text",
        icon: MapPin,
      },
      enableColumnFilter: true,
    },
    {
      id: "nif",
      accessorKey: "nif",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.nif} title={translations.nif} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate">
          {row.original.nif || "-"}
        </span>
      ),
      meta: {
        label: translations.nif,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "rcs",
      accessorKey: "rcs",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.rcs} title={translations.rcs} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate">
          {row.original.rcs || "-"}
        </span>
      ),
      meta: {
        label: translations.rcs,
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "saleAmountHT",
      accessorKey: "saleAmountHT",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.saleAmountHT} title={translations.saleAmountHT} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate font-medium">
          {formatCurrency(row.original.saleAmountHT)} DZD
        </span>
      ),
      meta: {
        label: translations.saleAmountHT,
        variant: "number",
        icon: DollarSign,
      },
      enableColumnFilter: false,
    },
    {
      id: "saleAmountTTC",
      accessorKey: "saleAmountTTC",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.saleAmountTTC} title={translations.saleAmountTTC} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate font-medium">
          {formatCurrency(row.original.saleAmountTTC)} DZD
        </span>
      ),
      meta: {
        label: translations.saleAmountTTC,
        variant: "number",
        icon: DollarSign,
      },
      enableColumnFilter: false,
    },
    {
      id: "totalTva",
      accessorKey: "totalTva",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.totalTva} title={translations.totalTva} />
      ),
      cell: ({ row }) => (
        <span className="max-w-125 truncate font-semibold">
          {formatCurrency(row.original.totalTva)} DZD
        </span>
      ),
      meta: {
        label: translations.totalTva,
        variant: "number",
        icon: DollarSign,
      },
      enableColumnFilter: false,
    },
  ];
}
