"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileDown, FileText, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getFilteredSalesCustomerPaymentsForExport } from "../../_lib/export-actions";
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions";

function formatCurrency(amount: string, currency: string): string {
  const numAmount = parseFloat(amount || "0");
  return numAmount.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ExportSalesCustomerPaymentsButtons() {
  const searchParams = useSearchParams();
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = React.useState(false);

  const handleExportPDF = React.useCallback(async () => {
    setIsExportingPDF(true);
    try {
      // Parse current search params to get filters
      const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
      const validFilters = getValidFilters(search.filters);

      // Get filtered payments
      const paymentsResult = await getFilteredSalesCustomerPaymentsForExport({
        ...search,
        filters: validFilters,
        startDate: search.startDate || undefined,
        endDate: search.endDate || undefined,
        clientId: search.clientId || [],
        paymentMethod: search.paymentMethod || [],
        date: search.date && search.date.length > 0 ? search.date : undefined,
        invoiceNumber: search.invoiceNumber || undefined,
      });

      const companyResult = await getCompanySettings();

      if (paymentsResult.error) {
        toast.error(paymentsResult.error);
        return;
      }

      const payments = paymentsResult.data || [];
      const companyInfo = companyResult.data;

      if (payments.length === 0) {
        toast.info("Aucun paiement à exporter");
        return;
      }

      const totalSaleAmount = payments.reduce((sum, p) => sum + parseFloat(p.saleAmount || "0"), 0);
      const totalCreditNoteAmount = payments.reduce((sum, p) => sum + parseFloat(p.creditNoteAmount || "0"), 0);
      const totalPaymentAmount = payments.reduce((sum, p) => sum + parseFloat(p.paymentAmount || "0"), 0);
      const currency = payments[0]?.currency || "DZD";

      // Get date range information
      let dateRangeText = "";
      if (search.date && search.date.length >= 2 && search.date[0] && search.date[1]) {
        const startDate = format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr });
        const endDate = format(new Date(search.date[1]), "dd/MM/yyyy", { locale: fr });
        dateRangeText = `Période: Du ${startDate} au ${endDate}`;
      } else if (search.startDate && search.endDate) {
        const startDate = format(new Date(search.startDate), "dd/MM/yyyy", { locale: fr });
        const endDate = format(new Date(search.endDate), "dd/MM/yyyy", { locale: fr });
        dateRangeText = `Période: Du ${startDate} au ${endDate}`;
      } else if (search.date && search.date.length === 1 && search.date[0]) {
        const date = format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr });
        dateRangeText = `Date: ${date}`;
      } else if (search.startDate) {
        const date = format(new Date(search.startDate), "dd/MM/yyyy", { locale: fr });
        dateRangeText = `Date: ${date}`;
      }

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
                ${dateRangeText ? `<p>${dateRangeText}</p>` : ""}
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${payments.length} paiement(s)</p>
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
                ${payments.map((p) => `
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

      toast.success(`Export PDF généré avec succès (${payments.length} paiement(s))`);
    } catch (error) {
      console.error("Error exporting to PDF", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  }, [searchParams]);

  const handleExportXLSX = React.useCallback(async () => {
    setIsExportingXLSX(true);
    try {
      // Parse current search params to get filters
      const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
      const validFilters = getValidFilters(search.filters);

      // Get filtered payments
      const paymentsResult = await getFilteredSalesCustomerPaymentsForExport({
        ...search,
        filters: validFilters,
        startDate: search.startDate || undefined,
        endDate: search.endDate || undefined,
        clientId: search.clientId || [],
        paymentMethod: search.paymentMethod || [],
        date: search.date && search.date.length > 0 ? search.date : undefined,
        invoiceNumber: search.invoiceNumber || undefined,
      });

      if (paymentsResult.error) {
        toast.error(paymentsResult.error);
        return;
      }

      const payments = paymentsResult.data || [];

      if (payments.length === 0) {
        toast.info("Aucun paiement à exporter");
        return;
      }

      // Get date range information
      let dateRangeText = "";
      if (search.date && search.date.length >= 2 && search.date[0] && search.date[1]) {
        const startDate = format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr });
        const endDate = format(new Date(search.date[1]), "dd/MM/yyyy", { locale: fr });
        dateRangeText = `Du ${startDate} au ${endDate}`;
      } else if (search.startDate && search.endDate) {
        const startDate = format(new Date(search.startDate), "dd/MM/yyyy", { locale: fr });
        const endDate = format(new Date(search.endDate), "dd/MM/yyyy", { locale: fr });
        dateRangeText = `Du ${startDate} au ${endDate}`;
      } else if (search.date && search.date.length === 1 && search.date[0]) {
        const date = format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr });
        dateRangeText = date;
      } else if (search.startDate) {
        const date = format(new Date(search.startDate), "dd/MM/yyyy", { locale: fr });
        dateRangeText = date;
      }

      // Format data for Excel
      const excelData = payments.map((p) => ({
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
      const totalSaleAmount = payments.reduce((sum, p) => sum + parseFloat(p.saleAmount || "0"), 0);
      const totalCreditNoteAmount = payments.reduce((sum, p) => sum + parseFloat(p.creditNoteAmount || "0"), 0);
      const totalPaymentAmount = payments.reduce((sum, p) => sum + parseFloat(p.paymentAmount || "0"), 0);

      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ...(dateRangeText ? [["Période", dateRangeText]] : []),
        ["Nombre de paiements", payments.length],
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

      toast.success(`Export XLSX généré avec succès (${payments.length} paiement(s))`);
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    } finally {
      setIsExportingXLSX(false);
    }
  }, [searchParams]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExportingPDF || isExportingXLSX}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExportingPDF || isExportingXLSX ? "Export en cours..." : "Exporter"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={handleExportPDF}
          disabled={isExportingPDF || isExportingXLSX}
        >
          <FileText className="mr-2 h-4 w-4" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleExportXLSX}
          disabled={isExportingPDF || isExportingXLSX}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exporter en Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


