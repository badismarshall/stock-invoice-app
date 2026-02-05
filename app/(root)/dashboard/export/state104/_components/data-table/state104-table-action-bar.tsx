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
import type { State104DTOItem } from "@/data/state104/state104.dto";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getState104ForTable } from "../../_lib/actions";
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions";
import { useSearchParams } from "next/navigation";
import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";

const actions = ["export-pdf", "export-xlsx"] as const;
type Action = (typeof actions)[number];

function formatCurrency(amount: string): string {
  return parseFloat(amount || "0").toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface State104TableActionBarProps {
  table: Table<State104DTOItem>;
}

export function State104TableActionBar({ table }: State104TableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const getSelectedRowsForExport = React.useCallback(async () => {
    const selectedIds = rows.map((r) => r.original.clientId);
    const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
    const validFilters = getValidFilters(search.filters);
    const result = await getState104ForTable({
      page: 1,
      perPage: 10000,
      sort: search.sort,
      filters: validFilters,
      filterFlag: search.filterFlag || undefined,
      joinOperator: search.joinOperator,
      clientId: search.clientId,
      date: search.date,
      address: search.address || undefined,
      nif: search.nif || undefined,
      rcs: search.rcs || undefined,
    });
    const allRows = result.data || [];
    return allRows.filter((r) => selectedIds.includes(r.clientId));
  }, [rows, searchParams]);

  const exportSelectedToPDF = React.useCallback(async () => {
    if (rows.length === 0) {
      toast.info("Aucune ligne sélectionnée");
      return;
    }
    setCurrentAction("export-pdf");
    setIsExporting(true);
    try {
      const selectedRows = await getSelectedRowsForExport();
      const companyResult = await getCompanySettings();
      const companyInfo = companyResult.data;

      if (selectedRows.length === 0) {
        toast.info("Aucune donnée à exporter");
        return;
      }

      const totalTva = selectedRows.reduce((sum, r) => sum + parseFloat(r.totalTva || "0"), 0);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Etat 104 - Export</title>
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
                <h2>Etat 104 - Export</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Nombre de clients: ${selectedRows.length}</p>
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
                ${selectedRows.map((r) => `
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
      toast.success(`Export PDF généré (${selectedRows.length} client(s))`);
    } catch (error) {
      console.error("Export PDF Etat104", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows, getSelectedRowsForExport]);

  const exportSelectedToXLSX = React.useCallback(async () => {
    if (rows.length === 0) {
      toast.info("Aucune ligne sélectionnée");
      return;
    }
    setCurrentAction("export-xlsx");
    setIsExporting(true);
    try {
      const selectedRows = await getSelectedRowsForExport();
      if (selectedRows.length === 0) {
        toast.info("Aucune donnée à exporter");
        return;
      }

      const excelData = selectedRows.map((r) => ({
        "Nom Client": r.clientName,
        "Adresse": r.address || "-",
        "NIF": r.nif || "-",
        "RCS": r.rcs || "-",
        "Chiffre d'affaires H.T": parseFloat(r.saleAmountHT ?? "0"),
        "Chiffre d'affaires TTC": parseFloat(r.saleAmountTTC ?? "0"),
        "Totale TVA": parseFloat(r.totalTva || "0"),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Etat104");
      const totalTva = selectedRows.reduce((sum, r) => sum + parseFloat(r.totalTva || "0"), 0);
      const summaryWs = XLSX.utils.aoa_to_sheet([
        ["Résumé"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de clients", selectedRows.length],
        ["Total TVA", totalTva],
      ]);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");
      XLSX.writeFile(wb, `etat104_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success(`Export Excel généré (${selectedRows.length} client(s))`);
    } catch (error) {
      console.error("Export XLSX Etat104", error);
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows, getSelectedRowsForExport]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator orientation="vertical" className="hidden data-[orientation=vertical]:h-5 sm:block" />
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Exporter les lignes sélectionnées"
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
