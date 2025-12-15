"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Hash,
  User,
  FileX,
} from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import type { DeliveryNoteCancellationDTOItem } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dto";

const translations = {
  cancellationNumber: "N° Annulation",
  searchCancellationNumber: "Rechercher un numéro...",
  originalNoteNumber: "N° Bon de Livraison",
  cancellationDate: "Date d'annulation",
  reason: "Raison",
  createdBy: "Créé par",
  createdAt: "Créé le",
};

export function getDeliveryNoteCancellationsTableColumns(): ColumnDef<DeliveryNoteCancellationDTOItem>[] {
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
      id: "originalNoteNumber",
      accessorKey: "originalNoteNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.originalNoteNumber} title={translations.originalNoteNumber} />
      ),
      cell: ({ row }) => {
        const noteNumber = row.getValue<string | null>("originalNoteNumber");
        return (
          <span className="max-w-125 truncate">
            {noteNumber || "-"}
          </span>
        );
      },
      meta: {
        label: translations.originalNoteNumber,
        variant: "text",
        icon: FileX,
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
  ];
}

