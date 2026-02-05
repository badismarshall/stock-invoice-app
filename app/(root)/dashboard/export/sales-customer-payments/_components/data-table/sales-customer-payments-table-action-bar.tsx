"use client";

import type { Table } from "@tanstack/react-table";
import { Download, FileText, FileDown } from "lucide-react";
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
import type { SalesCustomerPaymentDTOItem } from "@/data/sales-customer-payment/sales-customer-payment.dto";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSalesCustomerPaymentsForTable } from "../../_lib/actions";
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions";

const actions = [
  "export-pdf",
  "export-xlsx",
] as const;

type Action = (typeof actions)[number];

interface SalesCustomerPaymentsTableActionBarProps {
  table: Table<SalesCustomerPaymentDTOItem>;
}

function formatCurrency(amount: string, currency: string): string {
  const numAmount = parseFloat(amount || "0");
  return numAmount.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SalesCustomerPaymentsTableActionBar({ table }: SalesCustomerPaymentsTableActionBarProps) {
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
      
      // Get full payments for selected IDs
      const paymentsResult = await getSalesCustomerPaymentsForTable({
        page: 1,
        perPage: 10000,
      });

      const companyResult = await getCompanySettings();
      
      const allPayments = paymentsResult.data || [];
      const selectedPayments = allPayments.filter((p) => selectedIds.includes(p.id));
      const companyInfo = companyResult.data;

      if (selectedPayments.length === 0) {
        toast.info("Aucun paiement à exporter");
        return;
      }

      const totalSaleAmount = selectedPayments.reduce((sum, p) => sum + parseFloat(p.saleAmount || "0"), 0);
      const totalCreditNoteAmount = selectedPayments.reduce((sum, p) => sum + parseFloat(p.creditNoteAmount || "0"), 0);
      const totalPaymentAmount = selectedPayments.reduce((sum, p) => sum + parseFloat(p.paymentAmount || "0"), 0);
      const currency = selectedPayments[0]?.currency || "DZD";

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Chiffre d'affaire et Règlement Clients</title>
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
              .totals-summary {
                margin-top: 20px;
                padding: 12px;
                background-color: #eff6ff;
                border-top: 3px solid #3b82f6;
                display: flex;
                justify-content: space-between;
                gap: 20px;
                font-weight: 700;
                font-size: 10px;
                color: #1e40af;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                font-size: 8px;
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
                <h2>Chiffre d'affaire et Règlement Clients</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${selectedPayments.length} paiement(s)</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom Client</th>
                  <th>N°Facture</th>
                  <th class="text-right">Montant Vente</th>
                  <th class="text-right">Montant Avoir</th>
                  <th>Mode de réglement</th>
                  <th class="text-right">Valeur Réglé</th>
                </tr>
              </thead>
              <tbody>
                ${selectedPayments.map((p) => `
                  <tr>
                    <td>${format(p.date, "dd/MM/yyyy", { locale: fr })}</td>
                    <td>${p.clientName || "-"}</td>
                    <td>${p.invoiceNumber || "-"}</td>
                    <td class="text-right">${formatCurrency(p.saleAmount, p.currency || "DZD")}</td>
                    <td class="text-right">${parseFloat(p.creditNoteAmount || "0") > 0 ? `-${formatCurrency(p.creditNoteAmount, p.currency || "DZD")}` : formatCurrency("0", p.currency || "DZD")}</td>
                    <td>${p.paymentMethod === "cash" ? "Espèces" : p.paymentMethod === "check" ? "Chèque" : p.paymentMethod === "transfer" ? "Virement" : p.paymentMethod || "-"}</td>
                    <td class="text-right">${formatCurrency(p.paymentAmount, p.currency || "DZD")}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="totals-summary">
              <div>
                <strong>Totaux:</strong>
              </div>
              <div class="text-right">
                <strong>Montant Vente: ${formatCurrency(totalSaleAmount.toString(), currency)}</strong>
              </div>
              <div class="text-right">
                <strong>Montant Avoir: ${formatCurrency(totalCreditNoteAmount.toString(), currency)}</strong>
              </div>
              <div class="text-right">
                <strong>Valeur Réglé: ${formatCurrency(totalPaymentAmount.toString(), currency)}</strong>
              </div>
            </div>
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

      toast.success(`Export PDF généré avec succès (${selectedPayments.length} paiement(s))`);
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
      
      // Get full payments for selected IDs
      const paymentsResult = await getSalesCustomerPaymentsForTable({
        page: 1,
        perPage: 10000,
      });
      
      const allPayments = paymentsResult.data || [];
      const selectedPayments = allPayments.filter((p) => selectedIds.includes(p.id));

      if (selectedPayments.length === 0) {
        toast.info("Aucun paiement à exporter");
        return;
      }

      // Format data for Excel
      const excelData = selectedPayments.map((p) => ({
        "Date": format(p.date, "dd/MM/yyyy", { locale: fr }),
        "Nom Client": p.clientName || "-",
        "N°Facture": p.invoiceNumber || "-",
        "Montant Vente": parseFloat(p.saleAmount || "0"),
        "Montant Avoir": parseFloat(p.creditNoteAmount || "0"),
        "Mode de réglement": p.paymentMethod === "cash" ? "Espèces" : p.paymentMethod === "check" ? "Chèque" : p.paymentMethod === "transfer" ? "Virement" : p.paymentMethod || "-",
        "Valeur Réglé": parseFloat(p.paymentAmount || "0"),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const totalSaleAmount = selectedPayments.reduce((sum, p) => sum + parseFloat(p.saleAmount || "0"), 0);
      const totalCreditNoteAmount = selectedPayments.reduce((sum, p) => sum + parseFloat(p.creditNoteAmount || "0"), 0);
      const totalPaymentAmount = selectedPayments.reduce((sum, p) => sum + parseFloat(p.paymentAmount || "0"), 0);

      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de paiements", selectedPayments.length],
        ["Montant Vente Total", totalSaleAmount],
        ["Montant Avoir Total", totalCreditNoteAmount],
        ["Valeur Réglé Total", totalPaymentAmount],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Payments sheet
      if (excelData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Paiements");
      }

      // Generate filename
      const filename = `chiffre_affaire_reglement_clients_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${selectedPayments.length} paiement(s))`);
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows]);

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
              tooltip="Exporter les paiements sélectionnés"
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
      </div>
    </DataTableActionBar>
  );
}


