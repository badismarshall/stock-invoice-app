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
import { ExportStockDialog } from "./export-stock-dialog";
import type { StockCurrentDTOItem } from "@/data/stock/stock.dto";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actions = [
  "export-pdf",
  "export-xlsx",
] as const;

type Action = (typeof actions)[number];

interface StockCurrentTableActionBarProps {
  table: Table<StockCurrentDTOItem>;
}

export function StockCurrentTableActionBar({ table }: StockCurrentTableActionBarProps) {
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
      
      // Get full stock for selected IDs
      const { getStockByIds } = await import("../../_lib/export-actions");
      const { getCompanySettings } = await import("@/app/(root)/dashboard/invoices/_lib/actions");
      
      const [stockResult, companyResult] = await Promise.all([
        getStockByIds({ ids: selectedIds }),
        getCompanySettings(),
      ]);

      if (stockResult.error) {
        toast.error(stockResult.error);
        return;
      }

      const stock = stockResult.data || [];
      const companyInfo = companyResult.data;

      if (stock.length === 0) {
        toast.info("Aucun stock à exporter");
        return;
      }

      // Calculate totals
      const totalStockValue = stock.reduce((sum, item) => sum + item.stockValue, 0);
      const totalQuantity = stock.reduce((sum, item) => sum + item.quantityAvailable, 0);

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Stock Actuel</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4;
                margin: 1cm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 10px;
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
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1e40af;
              }
              .company-info p {
                font-size: 10px;
                margin: 3px 0;
                line-height: 1.5;
                color: #4b5563;
              }
              .export-title {
                text-align: right;
              }
              .export-title h2 {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1e40af;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 9px;
              }
              thead {
                background: linear-gradient(to bottom, #3b82f6, #2563eb);
                color: #ffffff;
              }
              th {
                padding: 10px 8px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #1e40af;
                font-size: 10px;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              th.text-right {
                text-align: right;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 9px;
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
              .summary {
                margin-top: 20px;
                padding: 15px;
                background: #f3f4f6;
                border-radius: 8px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-weight: 600;
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
                <h2>Stock Actuel</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${stock.length} produit(s)</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Unité</th>
                  <th class="text-right">Quantité</th>
                  <th class="text-right">Coût Moyen</th>
                  <th class="text-right">Valeur Stock</th>
                  <th>Dernier Mouvement</th>
                </tr>
              </thead>
              <tbody>
                ${stock.map((item) => `
                  <tr>
                    <td>${item.productCode || "-"}</td>
                    <td>${item.productName || "-"}</td>
                    <td>${item.categoryName || "-"}</td>
                    <td>${item.unitOfMeasure || "-"}</td>
                    <td class="text-right">${item.quantityAvailable.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                    <td class="text-right">${item.averageCost.toFixed(2)} DZD</td>
                    <td class="text-right">${item.stockValue.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} DZD</td>
                    <td>${item.lastMovementDate ? format(item.lastMovementDate, "dd/MM/yyyy", { locale: fr }) : "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="summary">
              <div class="summary-row">
                <span>Nombre de produits:</span>
                <span>${stock.length}</span>
              </div>
              <div class="summary-row">
                <span>Quantité totale:</span>
                <span>${totalQuantity.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
              </div>
              <div class="summary-row">
                <span>Valeur totale du stock:</span>
                <span>${totalStockValue.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} DZD</span>
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

      toast.success(`Export PDF généré avec succès (${stock.length} produit(s))`);
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
      
      // Get full stock for selected IDs
      const { getStockByIds } = await import("../../_lib/export-actions");
      
      const stockResult = await getStockByIds({ ids: selectedIds });

      if (stockResult.error) {
        toast.error(stockResult.error);
        return;
      }

      const stock = stockResult.data || [];

      if (stock.length === 0) {
        toast.info("Aucun stock à exporter");
        return;
      }

      // Calculate totals
      const totalStockValue = stock.reduce((sum, item) => sum + item.stockValue, 0);
      const totalQuantity = stock.reduce((sum, item) => sum + item.quantityAvailable, 0);

      // Prepare data for Excel
      const excelData = stock.map((item) => ({
        "Code": item.productCode || "-",
        "Produit": item.productName || "-",
        "Catégorie": item.categoryName || "-",
        "Unité de mesure": item.unitOfMeasure || "-",
        "Quantité Disponible": item.quantityAvailable,
        "Coût Moyen": item.averageCost,
        "Valeur Stock": item.stockValue,
        "Dernier Mouvement": item.lastMovementDate ? format(item.lastMovementDate, "dd/MM/yyyy", { locale: fr }) : "-",
        "Dernière Mise à Jour": format(item.lastUpdated, "dd/MM/yyyy", { locale: fr }),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de produits", stock.length],
        ["Quantité totale", totalQuantity],
        ["Valeur totale du stock", totalStockValue],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Stock sheet
      if (excelData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Stock Actuel");
      }

      // Generate filename
      const filename = `stock_actuel_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${stock.length} produit(s))`);
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
              tooltip="Exporter le stock sélectionné"
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
      <ExportStockDialog
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


