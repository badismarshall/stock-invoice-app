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
import { getState104ForTable } from "../../_lib/actions";
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions";

function formatCurrency(amount: string): string {
  return parseFloat(amount || "0").toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ExportState104Buttons() {
  const searchParams = useSearchParams();
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = React.useState(false);

  const handleExportPDF = React.useCallback(async () => {
    setIsExportingPDF(true);
    try {
      const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
      const validFilters = getValidFilters(search.filters);

      const [rowsResult, companyResult] = await Promise.all([
        getState104ForTable({
          page: 1,
          perPage: 10000,
          sort: search.sort,
          filters: validFilters,
          filterFlag: search.filterFlag || undefined,
          joinOperator: search.joinOperator,
          clientId: search.clientId,
          date: search.date,
        }),
        getCompanySettings(),
      ]);

      if (rowsResult.error) {
        toast.error(rowsResult.error);
        return;
      }

      const rows = rowsResult.data || [];
      const companyInfo = companyResult.data;

      if (rows.length === 0) {
        toast.info("Aucune donnée à exporter");
        return;
      }

      let dateRangeText = "";
      if (search.date && search.date.length >= 2 && search.date[0] && search.date[1]) {
        dateRangeText = `Période: Du ${format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(search.date[1]), "dd/MM/yyyy", { locale: fr })}`;
      } else if (search.date?.length === 1 && search.date[0]) {
        dateRangeText = `Date: ${format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr })}`;
      }

      const totalTva = rows.reduce((sum, r) => sum + parseFloat(r.totalTva || "0"), 0);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Etat 104</title>
            <meta charset="utf-8">
            <style>
              @page { size: A4 landscape; margin: 1cm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; font-size: 10px; padding: 20px; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px; }
              .company-info h1 { font-size: 18px; margin-bottom: 8px; color: #1e40af; }
              .company-info p { font-size: 9px; margin: 3px 0; color: #4b5563; }
              .export-title { text-align: right; }
              .export-title h2 { font-size: 18px; margin-bottom: 8px; color: #1e40af; }
              table { width: 100%; border-collapse: collapse; font-size: 9px; }
              thead { background: linear-gradient(to bottom, #3b82f6, #2563eb); color: #fff; }
              th { padding: 10px 8px; text-align: left; font-weight: 600; }
              th.text-right { text-align: right; }
              td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
              td.text-right { text-align: right; }
              tbody tr:nth-child(even) { background: #f9fafb; }
              .totals-summary { margin-top: 20px; padding: 12px; background: #eff6ff; border-top: 3px solid #3b82f6; font-weight: 700; font-size: 11px; color: #1e40af; }
              .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 9px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-info">
                <h1>${companyInfo?.name || "Sirof Algeria"}</h1>
                ${companyInfo?.address ? `<p>${companyInfo.address}</p>` : ""}
                ${companyInfo?.phone ? `<p>Tél: ${companyInfo.phone}</p>` : ""}
              </div>
              <div class="export-title">
                <h2>Etat 104</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                ${dateRangeText ? `<p>${dateRangeText}</p>` : ""}
                <p>Nombre de clients: ${rows.length}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nom Client</th>
                  <th>Adresse</th>
                  <th>NIF</th>
                  <th>RCS</th>
                  <th class="text-right">Chiffre d'affaires H.T</th>
                  <th class="text-right">Chiffre d'affaires TTC</th>
                  <th class="text-right">Totale TVA</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((r) => `
                  <tr>
                    <td>${r.clientName || "-"}</td>
                    <td>${r.address || "-"}</td>
                    <td>${r.nif || "-"}</td>
                    <td>${r.rcs || "-"}</td>
                    <td class="text-right">${formatCurrency(r.saleAmountHT ?? "0")} DZD</td>
                    <td class="text-right">${formatCurrency(r.saleAmountTTC ?? "0")} DZD</td>
                    <td class="text-right">${formatCurrency(r.totalTva)} DZD</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="totals-summary">Total TVA: ${formatCurrency(totalTva.toString())} DZD</div>
            <div class="footer">Document généré le ${format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}</div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Impossible d'ouvrir la fenêtre d'impression");
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 250);
      toast.success(`Export PDF généré (${rows.length} client(s))`);
    } catch (error) {
      console.error("Export PDF Etat104", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  }, [searchParams]);

  const handleExportXLSX = React.useCallback(async () => {
    setIsExportingXLSX(true);
    try {
      const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
      const validFilters = getValidFilters(search.filters);

      const rowsResult = await getState104ForTable({
        page: 1,
        perPage: 10000,
        sort: search.sort,
        filters: validFilters,
        filterFlag: search.filterFlag || undefined,
        joinOperator: search.joinOperator,
        clientId: search.clientId,
        date: search.date,
      });

      if (rowsResult.error) {
        toast.error(rowsResult.error);
        return;
      }

      const rows = rowsResult.data || [];
      if (rows.length === 0) {
        toast.info("Aucune donnée à exporter");
        return;
      }

      let dateRangeText = "";
      if (search.date && search.date.length >= 2 && search.date[0] && search.date[1]) {
        dateRangeText = `Du ${format(new Date(search.date[0]), "dd/MM/yyyy", { locale: fr })} au ${format(new Date(search.date[1]), "dd/MM/yyyy", { locale: fr })}`;
      }

      const excelData = rows.map((r) => ({
        "Nom Client": r.clientName,
        "Adresse": r.address || "-",
        "NIF": r.nif || "-",
        "RCS": r.rcs || "-",
        "Chiffre d'affaires H.T": parseFloat(r.saleAmountHT ?? "0"),
        "Chiffre d'affaires TTC": parseFloat(r.saleAmountTTC ?? "0"),
        "Totale TVA": parseFloat(r.totalTva || "0"),
      }));

      const wb = XLSX.utils.book_new();
      const totalTva = rows.reduce((sum, r) => sum + parseFloat(r.totalTva || "0"), 0);
      const summaryData = [
        ["Résumé Etat 104"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ...(dateRangeText ? [["Période", dateRangeText]] : []),
        ["Nombre de clients", rows.length],
        ["Total TVA", totalTva],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Etat104");
      XLSX.writeFile(wb, `etat104_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success(`Export Excel généré (${rows.length} client(s))`);
    } catch (error) {
      console.error("Export XLSX Etat104", error);
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExportingXLSX(false);
    }
  }, [searchParams]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExportingPDF || isExportingXLSX}>
          <Download className="mr-2 h-4 w-4" />
          {isExportingPDF || isExportingXLSX ? "Export en cours..." : "Exporter"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExportingPDF || isExportingXLSX}>
          <FileText className="mr-2 h-4 w-4" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportXLSX} disabled={isExportingPDF || isExportingXLSX}>
          <FileDown className="mr-2 h-4 w-4" />
          Exporter en Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
