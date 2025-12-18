"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Ellipsis,
  Hash,
  Building2,
  Badge as BadgeIcon,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Wallet,
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import type { DataTableRowAction } from "@/types/data-table";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";

interface GetSaleInvoicesTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<InvoiceDTOItem> | null>
  >;
  clients?: Array<{ id: string; name: string }>;
}

const translations = {
  invoiceNumber: "N° Facture",
  searchInvoiceNumber: "Rechercher un numéro...",
  client: "Client",
  invoiceDate: "Date facture",
  paymentStatus: "Statut paiement",
  status: "Statut",
  totalAmount: "Montant total",
  createdBy: "Créé par",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  print: "Imprimer",
  managePayments: "Gérer les paiements",
  addPayment: "Créer un paiement",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  active: "Actif",
  cancelled: "Annulé",
  unpaid: "Non payé",
  partiallyPaid: "Partiellement payé",
  paid: "Payé",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: translations.active, variant: "default" },
  cancelled: { label: translations.cancelled, variant: "destructive" },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: translations.unpaid, variant: "destructive" },
  partially_paid: { label: translations.partiallyPaid, variant: "outline" },
  paid: { label: translations.paid, variant: "default" },
};

export function getSaleInvoicesTableColumns({
  setRowAction,
  clients = [],
}: GetSaleInvoicesTableColumnsProps): ColumnDef<InvoiceDTOItem>[] {
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
      id: "invoiceNumber",
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.invoiceNumber} title={translations.invoiceNumber} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("invoiceNumber")}
          </span>
        );
      },
      meta: {
        label: translations.invoiceNumber,
        placeholder: translations.searchInvoiceNumber,
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
      id: "invoiceDate",
      accessorKey: "invoiceDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.invoiceDate} title={translations.invoiceDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>("invoiceDate");
        return formatDate(date);
      },
      meta: {
        label: translations.invoiceDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "paymentStatus",
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.paymentStatus} title={translations.paymentStatus} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("paymentStatus");
        const config = paymentStatusConfig[status] || { label: status, variant: "outline" as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: translations.paymentStatus,
        variant: "multiSelect",
        options: [
          { label: translations.unpaid, value: "unpaid", count: 0, icon: XCircle },
          { label: translations.partiallyPaid, value: "partially_paid", count: 0, icon: Clock },
          { label: translations.paid, value: "paid", count: 0, icon: CheckCircle2 },
        ],
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.status} title={translations.status} />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        const config = statusConfig[status] || { label: status, variant: "outline" as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: translations.status,
        variant: "multiSelect",
        options: [
          { label: translations.active, value: "active", count: 0, icon: CheckCircle2 },
          { label: translations.cancelled, value: "cancelled", count: 0, icon: XCircle },
        ],
        icon: BadgeIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "totalAmount",
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.totalAmount} title={translations.totalAmount} />
      ),
      cell: ({ row }) => {
        const amount = row.getValue<number>("totalAmount");
        return (
          <span className="max-w-125 truncate">
            {amount.toFixed(2)} DZD
          </span>
        );
      },
      meta: {
        align: "right",
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
        const invoice = row.original;

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
                onSelect={() => router.push(`/dashboard/payments/add?invoiceId=${invoice.id}`)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {translations.addPayment}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push(`/dashboard/payments?invoiceId=${invoice.id}`)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {translations.managePayments}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push(`/dashboard/invoices/print/${invoice.id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                {translations.print}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
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

