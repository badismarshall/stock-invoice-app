"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Hash,
  Building2,
  Wallet,
  DollarSign,
  FileText,
} from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/data-table/format";
import type { SalesCustomerPaymentDTOItem } from "@/data/sales-customer-payment/sales-customer-payment.dto";

function formatCurrency(amount: string, currency: string): string {
  const numAmount = parseFloat(amount || "0");
  return numAmount.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface GetSalesCustomerPaymentsTableColumnsProps {
  clients?: Array<{ id: string; name: string }>;
}

const translations = {
  date: "Date",
  client: "Nom Client",
  invoiceNumber: "N°Facture",
  saleAmount: "Montant Vente",
  creditNoteAmount: "Montant Avoir",
  paymentMethod: "Mode de réglement",
  paymentAmount: "Valeur Réglé",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  cash: "Espèces",
  check: "Chèque",
  transfer: "Virement",
  other: "Autre",
};

const paymentMethodLabels: Record<string, string> = {
  cash: translations.cash,
  check: translations.check,
  transfer: translations.transfer,
  other: translations.other,
};

export function getSalesCustomerPaymentsTableColumns({
  clients = [],
}: GetSalesCustomerPaymentsTableColumnsProps): ColumnDef<SalesCustomerPaymentDTOItem>[] {
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.date} title={translations.date} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>("date");
        return formatDate(date);
      },
      meta: {
        label: translations.date,
        variant: "dateRange",
        icon: CalendarIcon,
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
        })),
        icon: Building2,
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
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("invoiceNumber") || "-"}
          </span>
        );
      },
      meta: {
        label: translations.invoiceNumber,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "saleAmount",
      accessorKey: "saleAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.saleAmount} title={translations.saleAmount} />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue<string>("saleAmount") || "0");
        const currency = row.original.currency || "DZD";
        return (
          <span className="max-w-125 truncate font-medium">
            {formatCurrency(amount.toString(), currency)}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "creditNoteAmount",
      accessorKey: "creditNoteAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.creditNoteAmount} title={translations.creditNoteAmount} />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue<string>("creditNoteAmount") || "0");
        const currency = row.original.currency || "DZD";
        return (
          <span className="max-w-125 truncate font-medium text-destructive">
            {amount > 0 ? `-${formatCurrency(amount.toString(), currency)}` : formatCurrency("0", currency)}
          </span>
        );
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
        const method = row.getValue<string | null>("paymentMethod");
        return (
          <span className="max-w-125 truncate">
            {method ? paymentMethodLabels[method] || method : "-"}
          </span>
        );
      },
      meta: {
        label: translations.paymentMethod,
        variant: "multiSelect",
        options: [
          { label: translations.cash, value: "cash", count: 0 },
          { label: translations.check, value: "check", count: 0 },
          { label: translations.transfer, value: "transfer", count: 0 },
          { label: translations.other, value: "other", count: 0 },
        ],
        icon: Wallet,
      },
      enableColumnFilter: true,
    },
    {
      id: "paymentAmount",
      accessorKey: "paymentAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.paymentAmount} title={translations.paymentAmount} />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue<string>("paymentAmount") || "0");
        const currency = row.original.currency || "DZD";
        return (
          <span className="max-w-125 truncate font-semibold text-primary">
            {formatCurrency(amount.toString(), currency)}
          </span>
        );
      },
      enableColumnFilter: false,
    },
  ];
}


