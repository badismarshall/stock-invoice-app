"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, Trash2, Shield } from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/data-table/format";
import type { DataTableRowAction } from "@/types/data-table";

export interface RoleDTOItem {
  id: string;
  name: string;
  label: string;
  description: string | null;
  createdAt: Date;
  userCount: number;
}

interface GetRolesTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<RoleDTOItem> | null>
  >;
}

const translations = {
  name: "Nom",
  label: "Label",
  description: "Description",
  userCount: "Utilisateurs",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  managePermissions: "Gérer les permissions",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
};

export function getRolesTableColumns({
  setRowAction,
}: GetRolesTableColumnsProps): ColumnDef<RoleDTOItem>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.name} />
      ),
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{role.name}</span>
          </div>
        );
      },
      enableColumnFilter: true,
    },
    {
      id: "label",
      accessorKey: "label",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.label} />
      ),
      cell: ({ row }) => row.original.label,
      enableColumnFilter: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.description} />
      ),
      cell: ({ row }) => row.original.description || "-",
      enableColumnFilter: true,
    },
    {
      id: "userCount",
      accessorKey: "userCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.userCount} />
      ),
      cell: ({ row }) => row.original.userCount,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.createdAt} />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const router = useRouter();
        const role = row.original;

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
                onSelect={() => router.push(`/dashboard/roles/${role.id}/permissions`)}
              >
                <Shield className="mr-2 h-4 w-4" />
                {translations.managePermissions}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
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

