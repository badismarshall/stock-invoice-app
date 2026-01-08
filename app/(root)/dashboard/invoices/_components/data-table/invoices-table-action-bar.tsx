"use client";

import type { Table } from "@tanstack/react-table";
import { Download, Trash2, FileText, FileDown } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/shared/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportInvoicesDialog } from "./export-invoices-dialog";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actions = [
  "export-pdf",
  "export-xlsx",
  "delete",
] as const;

type Action = (typeof actions)[number];

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Non payé",
  partially_paid: "Partiellement payé",
  paid: "Payé",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  cancelled: "Annulé",
};

const invoiceTypeLabels: Record<string, string> = {
  sale_local: "Vente locale",
  sale_export: "Vente export",
  proforma: "Facture de Proforma",
  delivery_note_invoice: "Bon de Livraison",
  purchase: "Achat",
};

interface InvoicesTableActionBarProps {
  table: Table<InvoiceDTOItem>;
}

export function InvoicesTableActionBar({ table }: InvoicesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const exportSelectedToPDF = React.useCallback(async () => {
    if (rows.length === 0) {
      toast.info("Aucune ligne sélectionnée");
      return;
    }

    setCurrentAction("export-pdf");
    setIsExporting(true);
    
    try {
      const selectedIds = rows.map((row) => row.original.id);
      
      // Get full invoices for selected IDs
      const { getInvoicesByIds } = await import("../../_lib/export-actions");
      const { getCompanySettings } = await import("../../_lib/actions");
      
      const [invoicesResult, companyResult] = await Promise.all([
        getInvoicesByIds({ ids: selectedIds }),
        getCompanySettings(),
      ]);

      if (invoicesResult.error) {
        toast.error(invoicesResult.error);
        return;
      }

      const invoices = invoicesResult.data || [];
      const companyInfo = companyResult.data;

      if (invoices.length === 0) {
        toast.info("Aucune facture à exporter");
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Factures</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4 landscape;
                margin: 1cm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 9px;
                color: #1a1a1a;
                background: #ffffff;
                padding: 20px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .company-info h1 {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1e40af;
              }
              .company-info p {
                font-size: 9px;
                margin: 3px 0;
                line-height: 1.5;
                color: #4b5563;
              }
              .export-title {
                text-align: right;
              }
              .export-title h2 {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1e40af;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 8px;
              }
              thead {
                background: linear-gradient(to bottom, #3b82f6, #2563eb);
                color: #ffffff;
              }
              th {
                padding: 8px 6px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #1e40af;
                font-size: 9px;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              th.text-right {
                text-align: right;
              }
              td {
                padding: 6px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 8px;
                color: #374151;
              }
              td.text-right {
                text-align: right;
              }
              tbody tr:nth-child(even) {
                background-color: #f9fafb;
              }
              .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                font-size: 9px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-info">
                <h1>${companyInfo?.name || "Sirof Algeria"}</h1>
                <div>
                  ${companyInfo?.address ? `<p>${companyInfo.address}</p>` : ""}
                  ${companyInfo?.phone ? `<p>Tél: ${companyInfo.phone}</p>` : ""}
                  ${companyInfo?.email ? `<p>Email: ${companyInfo.email}</p>` : ""}
                </div>
              </div>
              <div class="export-title">
                <h2>Liste des Factures</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${invoices.length} facture(s)</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th>Date facture</th>
                  <th>Date d'échéance</th>
                  <th>Statut paiement</th>
                  <th>Statut</th>
                  <th class="text-right">Montant total</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map((invoice) => `
                  <tr>
                    <td>${invoice.invoiceNumber || "-"}</td>
                    <td>${invoiceTypeLabels[invoice.invoiceType] || invoice.invoiceType}</td>
                    <td>${invoice.clientName || "-"}</td>
                    <td>${format(new Date(invoice.invoiceDate), "dd/MM/yyyy", { locale: fr })}</td>
                    <td>${invoice.dueDate ? format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: fr }) : "-"}</td>
                    <td>${paymentStatusLabels[invoice.paymentStatus] || invoice.paymentStatus}</td>
                    <td>${statusLabels[invoice.status] || invoice.status}</td>
                    <td class="text-right">${parseFloat(invoice.totalAmount?.toString() || "0").toFixed(2)} ${invoice.currency || "DZD"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="footer">
              <p>Document généré le ${format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
            </div>
          </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Impossible d'ouvrir la fenêtre d'impression");
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 250);

      toast.success(`Export PDF généré avec succès (${invoices.length} facture(s))`);
    } catch (error) {
      console.error("Error exporting to PDF", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows]);

  const exportSelectedToXLSX = React.useCallback(async () => {
    if (rows.length === 0) {
      toast.info("Aucune ligne sélectionnée");
      return;
    }

    setCurrentAction("export-xlsx");
    setIsExporting(true);
    
    try {
      const selectedIds = rows.map((row) => row.original.id);
      
      // Get full invoices for selected IDs
      const { getInvoicesByIds } = await import("../../_lib/export-actions");
      
      const invoicesResult = await getInvoicesByIds({ ids: selectedIds });

      if (invoicesResult.error) {
        toast.error(invoicesResult.error);
        return;
      }

      const invoices = invoicesResult.data || [];

      if (invoices.length === 0) {
        toast.info("Aucune facture à exporter");
        return;
      }

      // Prepare data for Excel
      const excelData = invoices.map((invoice) => ({
        "N° Facture": invoice.invoiceNumber || "-",
        "Type": invoiceTypeLabels[invoice.invoiceType] || invoice.invoiceType,
        "Client": invoice.clientName || "-",
        "Date facture": format(new Date(invoice.invoiceDate), "dd/MM/yyyy", { locale: fr }),
        "Date d'échéance": invoice.dueDate ? format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: fr }) : "-",
        "Statut paiement": paymentStatusLabels[invoice.paymentStatus] || invoice.paymentStatus,
        "Statut": statusLabels[invoice.status] || invoice.status,
        "Montant total": parseFloat(invoice.totalAmount?.toString() || "0"),
        "Devise": invoice.currency || "DZD",
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de factures", invoices.length],
        ["Total montant", invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount?.toString() || "0"), 0).toFixed(2)],
        ["Factures payées", invoices.filter(i => i.paymentStatus === "paid").length],
        ["Factures non payées", invoices.filter(i => i.paymentStatus === "unpaid").length],
        ["Factures partiellement payées", invoices.filter(i => i.paymentStatus === "partially_paid").length],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Invoices sheet
      if (excelData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Factures");
      }

      // Generate filename
      const filename = `factures_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${invoices.length} facture(s))`);
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows]);

  const onInvoiceDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      // TODO: Implement delete invoices action
      toast.error("La suppression des factures n'est pas encore implémentée");
      // const { error } = await deleteInvoices({
      //   ids: rows.map((row) => row.original.id),
      // });

      // if (error) {
      //   toast.error(error);
      //   return;
      // }
      // toast.success("Factures supprimées");
      // table.toggleAllRowsSelected(false);
    });
  }, [rows, table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Exporter les factures sélectionnées"
              isPending={getIsActionPending("export-pdf") || getIsActionPending("export-xlsx")}
              disabled={isExporting}
            >
              <Download />
            </DataTableActionBarAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={exportSelectedToPDF}
              disabled={getIsActionPending("export-pdf") || getIsActionPending("export-xlsx")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exporter en PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={exportSelectedToXLSX}
              disabled={getIsActionPending("export-pdf") || getIsActionPending("export-xlsx")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exporter en Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DataTableActionBarAction
          size="icon"
          tooltip="Supprimer les factures"
          isPending={getIsActionPending("delete")}
          onClick={onInvoiceDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
      <ExportInvoicesDialog
        open={isExporting}
        onOpenChange={() => {}}
        message={
          currentAction === "export-pdf" 
            ? "Génération du PDF en cours..." 
            : currentAction === "export-xlsx"
            ? "Génération du fichier Excel en cours..."
            : "Export en cours..."
        }
      />
    </DataTableActionBar>
  );
}

