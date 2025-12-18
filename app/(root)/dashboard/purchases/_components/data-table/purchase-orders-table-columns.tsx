"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Ellipsis,
  Text,
  Hash,
  Building2,
  User,
  Badge as BadgeIcon,
  Clock,
  CheckCircle2,
  XCircle,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data-table/format";
import { getErrorMessage } from "@/lib/handle-error";
import { toast } from "sonner";
import type { DataTableRowAction } from "@/types/data-table";
import type { PurchaseOrderDTOItem } from "@/data/purchase-order/purchase-order.dto";
import { updatePurchaseOrderStatus, createInvoiceFromPurchaseOrder } from "../../_lib/actions";
import { FileText } from "lucide-react";

interface GetPurchaseOrdersTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<PurchaseOrderDTOItem> | null>
  >;
}

const translations = {
  orderNumber: "N° Commande",
  searchOrderNumber: "Rechercher un numéro...",
  supplier: "Fournisseur",
  orderDate: "Date commande",
  receptionDate: "Date réception",
  status: "Statut",
  totalAmount: "Montant total",
  createdBy: "Créé par",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  createInvoice: "Créer facture",
  printInvoice: "Imprimer facture",
  addPayment: "Créer un paiement",
  managePayments: "Gérer les paiements",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  pending: "En attente",
  received: "Reçu",
  cancelled: "Annulé",
  updating: "Mise à jour...",
  statusUpdated: "Statut mis à jour",
  creatingInvoice: "Création de la facture...",
  invoiceCreated: "Facture créée avec succès",
  invoiceAlreadyExists: "Une facture existe déjà pour cette commande",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: translations.pending, variant: "outline" },
  received: { label: translations.received, variant: "default" },
  cancelled: { label: translations.cancelled, variant: "destructive" },
};

export function getPurchaseOrdersTableColumns({
  setRowAction,
}: GetPurchaseOrdersTableColumnsProps): ColumnDef<PurchaseOrderDTOItem>[] {
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
      id: "orderNumber",
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.orderNumber} title={translations.orderNumber} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("orderNumber")}
          </span>
        );
      },
      meta: {
        label: translations.orderNumber,
        placeholder: translations.searchOrderNumber,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "supplierName",
      accessorKey: "supplierName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.supplier} title={translations.supplier} />
      ),
      cell: ({ row }) => {
        const supplierName = row.getValue<string | null>("supplierName");
        return (
          <span className="max-w-125 truncate">
            {supplierName || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "orderDate",
      accessorKey: "orderDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.orderDate} title={translations.orderDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>("orderDate");
        return formatDate(date);
      },
      meta: {
        label: translations.orderDate,
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "receptionDate",
      accessorKey: "receptionDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.receptionDate} title={translations.receptionDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date | null>("receptionDate");
        return date ? formatDate(date) : "-";
      },
      enableColumnFilter: false,
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
          {
            label: translations.pending,
            value: "pending",
            count: 0, // Counts would need to be fetched separately if needed
            icon: Clock,
          },
          {
            label: translations.received,
            value: "received",
            count: 0,
            icon: CheckCircle2,
          },
          {
            label: translations.cancelled,
            value: "cancelled",
            count: 0,
            icon: XCircle,
          },
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
        const amount = row.getValue<string | null>("totalAmount");
        const amountValue = amount ? parseFloat(amount) : 0;
        return (
          <span className="max-w-125 truncate font-medium">
            {amountValue.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
            })}
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
        const createdByName = row.getValue<string | null>("createdByName");
        return (
          <span className="max-w-125 truncate">
            {createdByName || "-"}
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
        const [isUpdatePending, startUpdateTransition] = React.useTransition();
        const [isCreatingInvoice, setIsCreatingInvoice] = React.useState(false);

        const handleCreateInvoice = async () => {
          setIsCreatingInvoice(true);
          try {
            const result = await createInvoiceFromPurchaseOrder({
              purchaseOrderId: row.original.id,
            });

            if (result.error) {
              toast.error(result.error);
              return;
            }

            if (result.alreadyExists && result.data) {
              toast.info(translations.invoiceAlreadyExists, {
                description: `Facture: ${result.data.invoiceNumber}`,
              });
              router.push(`/dashboard/invoices/print/${result.data.invoiceId}`);
            } else if (result.data) {
              toast.success(translations.invoiceCreated, {
                description: `Facture: ${result.data.invoiceNumber}`,
              });
              router.push(`/dashboard/invoices/print/${result.data.invoiceId}`);
            }
          } catch (error) {
            toast.error(getErrorMessage(error));
          } finally {
            setIsCreatingInvoice(false);
          }
        };

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
                onSelect={() => router.push(`/dashboard/purchases/modify/${row.original.id}`)}
              >
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{translations.status}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={row.original.status || "pending"}
                    onValueChange={(value) => {
                      startUpdateTransition(() => {
                        toast.promise(
                          updatePurchaseOrderStatus({
                            id: row.original.id,
                            status: value as "pending" | "received" | "cancelled",
                          }),
                          {
                            loading: translations.updating,
                            success: translations.statusUpdated,
                            error: (err) => getErrorMessage(err),
                          },
                        );
                      });
                    }}
                  >
                    <DropdownMenuRadioItem
                      value="pending"
                      disabled={isUpdatePending}
                    >
                      {translations.pending}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="received"
                      disabled={isUpdatePending}
                    >
                      {translations.received}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="cancelled"
                      disabled={isUpdatePending}
                    >
                      {translations.cancelled}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleCreateInvoice}
                disabled={isCreatingInvoice}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isCreatingInvoice ? translations.creatingInvoice : translations.createInvoice}
              </DropdownMenuItem>
              {row.original.invoiceId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => router.push(`/dashboard/payments/add?invoiceId=${row.original.invoiceId}`)}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {translations.addPayment}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => router.push(`/dashboard/payments?invoiceId=${row.original.invoiceId}`)}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {translations.managePayments}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => router.push(`/dashboard/invoices/print/${row.original.invoiceId}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {translations.printInvoice}
                  </DropdownMenuItem>
                </>
              )}
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

