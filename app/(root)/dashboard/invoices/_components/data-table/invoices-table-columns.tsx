"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Hash,
  Building2,
  DollarSign,
  Badge as BadgeIcon,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";

const translations = {
  invoiceNumber: "N° Facture",
  invoiceType: "Type",
  clientName: "Client",
  supplierName: "Fournisseur",
  invoiceDate: "Date Facture",
  dueDate: "Date Échéance",
  totalAmount: "Montant Total",
  paymentStatus: "Statut Paiement",
  status: "Statut",
  createdByName: "Créé par",
  createdAt: "Créé le",
  unpaid: "Impayée",
  partially_paid: "Partiellement Payée",
  paid: "Payée",
  sale_local: "Vente Locale",
  sale_export: "Vente Export",
  proforma: "Proforma",
  purchase: "Achat",
  active: "Active",
  cancelled: "Annulée",
  overdue: "Échue",
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: translations.unpaid, variant: "destructive" },
  partially_paid: { label: translations.partially_paid, variant: "outline" },
  paid: { label: translations.paid, variant: "default" },
};

const invoiceTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sale_local: { label: translations.sale_local, variant: "default" },
  sale_export: { label: translations.sale_export, variant: "secondary" },
  proforma: { label: translations.proforma, variant: "outline" },
  purchase: { label: translations.purchase, variant: "outline" },
};

export function getInvoicesTableColumns(): ColumnDef<InvoiceDTOItem>[] {
  return [
    {
      id: "invoiceNumber",
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.invoiceNumber} title={translations.invoiceNumber} />
      ),
      cell: ({ row }) => {
        const number = row.getValue<string>("invoiceNumber");
        return (
          <span className="max-w-125 truncate font-medium">
            {number}
          </span>
        );
      },
      meta: {
        label: translations.invoiceNumber,
        placeholder: "Rechercher un numéro...",
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "invoiceType",
      accessorKey: "invoiceType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.invoiceType} title={translations.invoiceType} />
      ),
      cell: ({ row }) => {
        const type = row.getValue<string>("invoiceType");
        const config = invoiceTypeConfig[type] || { label: type, variant: "outline" as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: translations.invoiceType,
        variant: "multiSelect",
        options: [
          { label: translations.sale_local, value: "sale_local", count: 0 },
          { label: translations.sale_export, value: "sale_export", count: 0 },
          { label: translations.proforma, value: "proforma", count: 0 },
          { label: translations.purchase, value: "purchase", count: 0 },
        ],
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "clientName",
      accessorKey: "clientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.clientName} title={translations.clientName} />
      ),
      cell: ({ row }) => {
        const name = row.getValue<string | null>("clientName");
        const supplierName = row.original.supplierName;
        return (
          <span className="max-w-125 truncate">
            {name || supplierName || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "invoiceDate",
      accessorKey: "invoiceDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.invoiceDate} title={translations.invoiceDate} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
      meta: {
        label: translations.invoiceDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "dueDate",
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.dueDate} title={translations.dueDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date | null>("dueDate");
        const isOverdue = row.original.isOverdue;
        if (!date) return "-";
        return (
          <div className="flex items-center gap-2">
            <span className={isOverdue ? "text-destructive font-medium" : ""}>
              {formatDate(date)}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {translations.overdue}
              </Badge>
            )}
          </div>
        );
      },
      meta: {
        label: translations.dueDate,
        variant: "dateRange",
        icon: CalendarIcon,
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
          <span className="max-w-125 truncate font-semibold">
            {amount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        );
      },
      meta: {
        label: translations.totalAmount,
        variant: "number",
        icon: DollarSign,
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
          { label: translations.partially_paid, value: "partially_paid", count: 0, icon: Clock },
          { label: translations.paid, value: "paid", count: 0, icon: CheckCircle2 },
        ],
        icon: BadgeIcon,
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
        return (
          <Badge variant={status === "active" ? "default" : "destructive"}>
            {status === "active" ? translations.active : translations.cancelled}
          </Badge>
        );
      },
      meta: {
        label: translations.status,
        variant: "multiSelect",
        options: [
          { label: translations.active, value: "active", count: 0 },
          { label: translations.cancelled, value: "cancelled", count: 0 },
        ],
        icon: BadgeIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdByName",
      accessorKey: "createdByName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.createdByName} title={translations.createdByName} />
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

