"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Ellipsis,
  Hash,
  Badge as BadgeIcon,
  CheckCircle2,
  XCircle,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/handle-error";
import { updateDeliveryNoteStatus, getInvoicesByDeliveryNoteId, createInvoiceFromDeliveryNote } from "../../../_lib/actions";
import { formatDate } from "@/lib/data-table/format";
import type { DataTableRowAction } from "@/types/data-table";
import type { DeliveryNoteDTOItem } from "@/data/delivery-note/delivery-note.dto";

interface GetDeliveryNotesTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<DeliveryNoteDTOItem> | null>
  >;
}

const translations = {
  noteNumber: "N° Bon de Livraison",
  searchNoteNumber: "Rechercher un numéro...",
  client: "Client",
  noteDate: "Date",
  status: "Statut",
  totalAmount: "Montant total",
  createdBy: "Créé par",
  createdAt: "Créé le",
  edit: "Modifier",
  delete: "Supprimer",
  selectAll: "Tout sélectionner",
  selectRow: "Sélectionner la ligne",
  active: "Actif",
  cancelled: "Annulé",
  updating: "Mise à jour...",
  statusUpdated: "Statut mis à jour",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: translations.active, variant: "default" },
  cancelled: { label: translations.cancelled, variant: "destructive" },
};

export function getDeliveryNotesTableColumns({
  setRowAction,
}: GetDeliveryNotesTableColumnsProps): ColumnDef<DeliveryNoteDTOItem>[] {
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
      id: "noteNumber",
      accessorKey: "noteNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.noteNumber} title={translations.noteNumber} />
      ),
      cell: ({ row }) => {
        return (
          <span className="max-w-125 truncate font-medium">
            {row.getValue("noteNumber")}
          </span>
        );
      },
      meta: {
        label: translations.noteNumber,
        placeholder: translations.searchNoteNumber,
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "clientName",
      accessorKey: "clientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.client} title={translations.client} />
      ),
      cell: ({ row }) => {
        const clientName = row.getValue<string | null>("clientName");
        return (
          <span className="max-w-125 truncate">
            {clientName || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      id: "noteDate",
      accessorKey: "noteDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={translations.noteDate} title={translations.noteDate} />
      ),
      cell: ({ row }) => {
        const date = row.getValue<Date>("noteDate");
        return formatDate(date);
      },
      meta: {
        label: translations.noteDate,
        variant: "dateRange",
        icon: CalendarIcon,
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
          { label: translations.active, value: "active", count: 0 },
          { label: translations.cancelled, value: "cancelled", count: 0 },
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
        const amount = row.getValue<number | undefined>("totalAmount") || 0;
        return (
          <span className="max-w-125 truncate font-medium">
            {amount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "DZD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
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
        const deliveryNote = row.original;
        const [isUpdatePending, startUpdateTransition] = React.useTransition();
        const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(true);
        const [invoices, setInvoices] = React.useState<Array<{ id: string; invoiceNumber: string; invoiceType: string }>>([]);

        // Load invoices when component mounts
        React.useEffect(() => {
          const loadInvoices = async () => {
            setIsLoadingInvoices(true);
            try {
              const result = await getInvoicesByDeliveryNoteId({ deliveryNoteId: deliveryNote.id });
              if (result.data) {
                setInvoices(result.data);
              }
            } catch (error) {
              console.error("Error loading invoices", error);
            } finally {
              setIsLoadingInvoices(false);
            }
          };
          loadInvoices();
        }, [deliveryNote.id]);

        const deliveryNoteInvoice = invoices.find(inv => inv.invoiceType === "delivery_note_invoice");
        const exportInvoice = invoices.find(inv => inv.invoiceType === "sale_export");

        const [isCreatingDeliveryNoteInvoice, setIsCreatingDeliveryNoteInvoice] = React.useState(false);
        const [isCreatingExportInvoice, setIsCreatingExportInvoice] = React.useState(false);

        const handleCreateDeliveryNoteInvoice = async () => {
          // If invoice already exists, just print it
          if (deliveryNoteInvoice) {
            router.push(`/dashboard/invoices/print/${deliveryNoteInvoice.id}`);
            return;
          }

          setIsCreatingDeliveryNoteInvoice(true);
          try {
            const result = await createInvoiceFromDeliveryNote({
              deliveryNoteId: deliveryNote.id,
              invoiceType: "delivery_note_invoice",
            });

            if (result.error) {
              toast.error(result.error);
              return;
            }

            if (result.alreadyExists && result.data) {
              toast.info("Bon de livraison déjà créé", {
                description: `Facture: ${result.data.invoiceNumber}`,
              });
              router.push(`/dashboard/invoices/print/${result.data.invoiceId}`);
            } else if (result.data) {
              toast.success("Bon de livraison créé", {
                description: `Facture: ${result.data.invoiceNumber}`,
              });
              router.push(`/dashboard/invoices/print/${result.data.invoiceId}`);
            }
          } catch (error) {
            toast.error(getErrorMessage(error));
          } finally {
            setIsCreatingDeliveryNoteInvoice(false);
            // Reload invoices
            const result = await getInvoicesByDeliveryNoteId({ deliveryNoteId: deliveryNote.id });
            if (result.data) {
              setInvoices(result.data);
            }
          }
        };

        const handleCreateExportInvoice = async () => {
          // If invoice already exists, just print it
          if (exportInvoice) {
            router.push(`/dashboard/invoices/print/${exportInvoice.id}`);
            return;
          }

          setIsCreatingExportInvoice(true);
          try {
            const result = await createInvoiceFromDeliveryNote({
              deliveryNoteId: deliveryNote.id,
              invoiceType: "sale_export",
            });

            if (result.error) {
              toast.error(result.error);
              return;
            }

            if (result.alreadyExists && result.data) {
              toast.info("Facture export déjà créée", {
                description: `Facture: ${result.data.invoiceNumber}`,
              });
              router.push(`/dashboard/invoices/print/${result.data.invoiceId}`);
            } else if (result.data) {
              toast.success("Facture export créée", {
                description: `Facture: ${result.data.invoiceNumber}`,
              });
              router.push(`/dashboard/invoices/print/${result.data.invoiceId}`);
            }
          } catch (error) {
            toast.error(getErrorMessage(error));
          } finally {
            setIsCreatingExportInvoice(false);
            // Reload invoices
            const result = await getInvoicesByDeliveryNoteId({ deliveryNoteId: deliveryNote.id });
            if (result.data) {
              setInvoices(result.data);
            }
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
                onSelect={() => router.push(`/dashboard/export/delivery-note/modify/${deliveryNote.id}`)}
              >
                {translations.edit}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{translations.status}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={deliveryNote.status || "active"}
                    onValueChange={(value) => {
                      startUpdateTransition(() => {
                        toast.promise(
                          updateDeliveryNoteStatus({
                            id: deliveryNote.id,
                            status: value as "active" | "cancelled",
                          }),
                          {
                            loading: translations.updating,
                            success: translations.statusUpdated,
                            error: (err) => getErrorMessage(err),
                          }
                        );
                      });
                    }}
                  >
                    <DropdownMenuRadioItem
                      value="active"
                      disabled={isUpdatePending}
                    >
                      {translations.active}
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
                onSelect={handleCreateDeliveryNoteInvoice}
                disabled={isCreatingDeliveryNoteInvoice || isCreatingExportInvoice}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isCreatingDeliveryNoteInvoice ? "Création..." : deliveryNoteInvoice ? "Imprimer Bon de Livraison" : "Créer Bon de Livraison"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleCreateExportInvoice}
                disabled={isCreatingExportInvoice || isCreatingDeliveryNoteInvoice}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isCreatingExportInvoice ? "Création..." : exportInvoice ? "Imprimer Facture Export" : "Créer Facture Export"}
              </DropdownMenuItem>
              {exportInvoice && (
                <DropdownMenuItem
                  onSelect={() => router.push(`/dashboard/payments?invoiceId=${exportInvoice.id}`)}
                >
                  Créer un paiement
                </DropdownMenuItem>
              )}
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

