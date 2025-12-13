"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  Mail,
  MapPin,
  Phone,
  Text,
  Hash,
  FileText,
} from "lucide-react";
import * as React from "react";
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
import { formatDate } from "@/lib/data-table/format";
import type { DataTableRowAction } from "@/types/data-table";
import type { PartnerDTOItem } from "@/data/partner/partner.dto";

interface GetPartnersTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<PartnerDTOItem> | null>
  >;
}

const translations = {
  name: "Nom / Raison Sociale",
  searchNames: "Rechercher un client...",
  phone: "Téléphone",
  searchPhone: "Rechercher un téléphone...",
  email: "Email",
  searchEmail: "Rechercher un email...",
  address: "Adresse",
  searchAddress: "Rechercher une adresse...",
  credit: "Crédit",
  nif: "NIF",
  searchNif: "Rechercher un NIF...",
  rc: "RC",
  searchRc: "Rechercher un RC...",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
};

export function getPartnersTableColumns({
  setRowAction,
}: GetPartnersTableColumnsProps): ColumnDef<PartnerDTOItem>[] {
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
      id: "phone",
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.phone} title={translations.phone} />
      ),
      cell: ({ row }) => {
        const phone = row.getValue<string | null>("phone");
        return (
          <span className="max-w-125 truncate">
            {phone || "-"}
          </span>
        );
      },
      meta: {
        label: translations.phone,
        placeholder: translations.searchPhone,
        variant: "text",
        icon: Phone,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.email} title={translations.email} />
      ),
      cell: ({ row }) => {
        const email = row.getValue<string | null>("email");
        return (
          <span className="max-w-125 truncate">
            {email || "-"}
          </span>
        );
      },
      meta: {
        label: translations.email,
        placeholder: translations.searchEmail,
        variant: "text",
        icon: Mail,
      },
      enableColumnFilter: true,
    },
    {
      id: "address",
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.address} title={translations.address} />
      ),
      cell: ({ row }) => {
        const address = row.getValue<string | null>("address");
        return (
          <span className="max-w-125 truncate">
            {address || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "credit",
      accessorKey: "credit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.credit} title={translations.credit} />
      ),
      cell: ({ row }) => {
        const credit = row.getValue<string | null>("credit");
        const creditValue = credit ? parseFloat(credit) : 0;
        return (
          <span className="max-w-125 truncate font-medium">
            {creditValue.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "nif",
      accessorKey: "nif",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.nif} title={translations.nif} />
      ),
      cell: ({ row }) => {
        const nif = row.getValue<string | null>("nif");
        return (
          <span className="max-w-125 truncate">
            {nif || "-"}
          </span>
        );
      },
      meta: {
        label: translations.nif,
        placeholder: translations.searchNif,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "rc",
      accessorKey: "rc",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.rc} title={translations.rc} />
      ),
      cell: ({ row }) => {
        const rc = row.getValue<string | null>("rc");
        return (
          <span className="max-w-125 truncate">
            {rc || "-"}
          </span>
        );
      },
      meta: {
        label: translations.rc,
        placeholder: translations.searchRc,
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
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
                onSelect={() => setRowAction({ row, variant: "update" })}
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

