"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Hash,
  User,
  Building2,
  Ellipsis,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import type { DeliveryNoteCancellationDTOItem } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dto";

const translations = {
  cancellationNumber: "N° Annulation",
  searchCancellationNumber: "Rechercher un numéro...",
  client: "Client",
  cancellationDate: "Date d'annulation",
  reason: "Raison",
  createdBy: "Créé par",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
};

interface GetDeliveryNoteCancellationsTableColumnsProps {
  clients?: Array<{ id: string; name: string }>;
}

export function getDeliveryNoteCancellationsTableColumns({ clients = [] }: GetDeliveryNoteCancellationsTableColumnsProps): ColumnDef<DeliveryNoteCancellationDTOItem>[] {
  return [
    {
      id: "cancellationNumber",
      accessorKey: "cancellationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.cancellationNumber} title={translations.cancellationNumber} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("cancellationNumber")}
          </span>
        );
      },
      meta: {
        label: translations.cancellationNumber,
        placeholder: translations.searchCancellationNumber,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "clientId",
      accessorKey: "clientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.client} title={translations.client} />
      ),
      cell: ({ row }) => {
        const clientName = row.original.clientName;
        return (
          <span className="max-w-125 truncate">
            {clientName || "-"}
          </span>
        );
      },
      meta: {
        label: translations.client,
        variant: "multiSelect",
        options: clients.map((client) => ({
          label: client.name,
          value: client.id,
          count: 0,
          icon: Building2,
        })),
        icon: Building2,
      },
      enableColumnFilter: true,
    },
    {
      id: "cancellationDate",
      accessorKey: "cancellationDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.cancellationDate} title={translations.cancellationDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>("cancellationDate");
        return formatDate(date);
      },
      meta: {
        label: translations.cancellationDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "reason",
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.reason} title={translations.reason} />
      ),
      cell: ({ row }) => {
        const reason = row.getValue<string | null>("reason");
        return (
          <span className="max-w-125 truncate">
            {reason || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
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
        const cancellation = row.original;

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
                onSelect={() => router.push(`/dashboard/delivery-notes-cancellation/modify/${cancellation.id}`)}
              >
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push(`/dashboard/delivery-notes-cancellation/delete/${cancellation.id}`)}
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

