"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Ellipsis,
  Hash,
  Building2,
  DollarSign,
  FileText,
  Pencil,
  Trash2,
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
import type { PaymentDTOItem } from "@/data/payment/payment.dto";
import { PermissionGuard } from "@/components/shared/permission-guard";

interface GetPaymentsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<PaymentDTOItem> | null>
  >;
  clients?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
}

const translations = {
  paymentNumber: "N° Paiement",
  searchPaymentNumber: "Rechercher un numéro...",
  invoiceNumber: "N° Facture",
  client: "Client",
  supplier: "Fournisseur",
  paymentDate: "Date de paiement",
  amount: "Montant",
  paymentMethod: "Méthode",
  reference: "Référence",
  createdBy: "Créé par",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  viewInvoice: "Voir la facture",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  cash: "Espèces",
  check: "Chèque",
  transfer: "Virement",
  other: "Autre",
};

const paymentMethodConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  cash: { label: translations.cash, variant: "default" },
  check: { label: translations.check, variant: "secondary" },
  transfer: { label: translations.transfer, variant: "outline" },
  other: { label: translations.other, variant: "outline" },
};

export function getPaymentsTableColumns({
  setRowAction,
  clients = [],
  suppliers = [],
}: GetPaymentsTableColumnsProps): ColumnDef<PaymentDTOItem>[] {
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
      id: "paymentNumber",
      accessorKey: "paymentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.paymentNumber} title={translations.paymentNumber} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("paymentNumber")}
          </span>
        );
      },
      meta: {
        label: translations.paymentNumber,
        placeholder: translations.searchPaymentNumber,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "invoiceNumber",
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.invoiceNumber} title={translations.invoiceNumber} />
      ),
      cell: ({ row }) => {
        const invoiceNumber = row.getValue<string | null>("invoiceNumber");
        return (
          <span className="max-w-125 truncate font-medium text-blue-600 hover:underline cursor-pointer">
            {invoiceNumber || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "clientId",
      accessorKey: "clientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.client} title={translations.client} />
      ),
      cell: ({ row }) => {
        const clientName = row.original.clientName;
        const supplierName = row.original.supplierName;
        return (
          <span className="max-w-125 truncate">
            {clientName || supplierName || "-"}
          </span>
        );
      },
      meta: {
        label: "Client/Fournisseur",
        variant: "multiSelect",
        options: [
          ...clients.map((client) => ({
            label: client.name,
            value: client.id,
            count: 0,
            icon: Building2,
          })),
          ...suppliers.map((supplier) => ({
            label: supplier.name,
            value: supplier.id,
            count: 0,
            icon: Building2,
          })),
        ],
        icon: Building2,
      },
      enableColumnFilter: true,
    },
    {
      id: "paymentDate",
      accessorKey: "paymentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.paymentDate} title={translations.paymentDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>("paymentDate");
        return formatDate(date);
      },
      meta: {
        label: translations.paymentDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.amount} title={translations.amount} />
      ),
      cell: ({ row }) => {
        const amount = row.getValue<number>("amount");
        return (
          <span className="max-w-125 truncate font-semibold">
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
      id: "paymentMethod",
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.paymentMethod} title={translations.paymentMethod} />
      ),
      cell: ({ row }) => {
        const method = row.getValue<string>("paymentMethod");
        const config = paymentMethodConfig[method] || { label: method, variant: "outline" as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: translations.paymentMethod,
        variant: "multiSelect",
        options: [
          { label: translations.cash, value: "cash", count: 0, icon: DollarSign },
          { label: translations.check, value: "check", count: 0, icon: DollarSign },
          { label: translations.transfer, value: "transfer", count: 0, icon: DollarSign },
          { label: translations.other, value: "other", count: 0, icon: DollarSign },
        ],
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
    {
      id: "reference",
      accessorKey: "reference",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.reference} title={translations.reference} />
      ),
      cell: ({ row }) => {
        const reference = row.getValue<string | null>("reference");
        return (
          <span className="max-w-125 truncate">
            {reference || "-"}
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
        const payment = row.original;

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
              {payment.invoiceId && (
                <PermissionGuard permission="invoices.print">
                  <>
                    <DropdownMenuItem
                      onSelect={() => router.push(`/dashboard/invoices/print/${payment.invoiceId}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {translations.viewInvoice}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                </PermissionGuard>
              )}
              <PermissionGuard permission="payments.update">
                <DropdownMenuItem
                  onSelect={() => router.push(`/dashboard/payments/modify/${payment.id}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {translations.edit}
                </DropdownMenuItem>
              </PermissionGuard>
              <PermissionGuard permission="payments.delete">
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setRowAction({ row, variant: "delete" })}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {translations.delete}
                  </DropdownMenuItem>
                </>
              </PermissionGuard>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
      enableHiding: false,
    },
  ];
}

