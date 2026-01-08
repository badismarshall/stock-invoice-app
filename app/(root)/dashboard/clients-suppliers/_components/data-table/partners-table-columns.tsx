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
  type?: "client" | "fournisseur";
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
  nafApe: "NAF-APE",
  searchNafApe: "Rechercher un NAF-APE...",
  rcsRm: "RCS/RM",
  searchRcsRm: "Rechercher un RCS/RM...",
  eori: "EORI",
  searchEori: "Rechercher un EORI...",
  tvaNumber: "N° TVA",
  searchTvaNumber: "Rechercher un N° TVA...",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
};

export function getPartnersTableColumns({
  setRowAction,
  type,
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
      id: "nafApe",
      accessorKey: "nafApe",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.nafApe} title={translations.nafApe} />
      ),
      cell: ({ row }) => {
        const nafApe = row.getValue<string | null>("nafApe");
        return (
          <span className="max-w-125 truncate">
            {nafApe || "-"}
          </span>
        );
      },
      meta: {
        label: translations.nafApe,
        placeholder: translations.searchNafApe,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "rcsRm",
      accessorKey: "rcsRm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.rcsRm} title={translations.rcsRm} />
      ),
      cell: ({ row }) => {
        const rcsRm = row.getValue<string | null>("rcsRm");
        return (
          <span className="max-w-125 truncate">
            {rcsRm || "-"}
          </span>
        );
      },
      meta: {
        label: translations.rcsRm,
        placeholder: translations.searchRcsRm,
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "eori",
      accessorKey: "eori",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.eori} title={translations.eori} />
      ),
      cell: ({ row }) => {
        const eori = row.getValue<string | null>("eori");
        return (
          <span className="max-w-125 truncate">
            {eori || "-"}
          </span>
        );
      },
      meta: {
        label: translations.eori,
        placeholder: translations.searchEori,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "tvaNumber",
      accessorKey: "tvaNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.tvaNumber} title={translations.tvaNumber} />
      ),
      cell: ({ row }) => {
        const tvaNumber = row.getValue<string | null>("tvaNumber");
        return (
          <span className="max-w-125 truncate">
            {tvaNumber || "-"}
          </span>
        );
      },
      meta: {
        label: translations.tvaNumber,
        placeholder: translations.searchTvaNumber,
        variant: "text",
        icon: Hash,
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

