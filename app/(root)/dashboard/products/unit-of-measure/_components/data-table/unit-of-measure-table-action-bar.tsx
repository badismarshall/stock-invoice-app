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
import { ExportUnitsOfMeasureDialog } from "./export-units-of-measure-dialog";
import type { UnitOfMeasureDTOItem } from "@/data/unit-of-measure/unit-of-measure.dto";
import { deleteUnitsOfMeasure } from "../../_lib/actions";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actions = [
  "export-pdf",
  "export-xlsx",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface UnitOfMeasureTableActionBarProps {
  table: Table<UnitOfMeasureDTOItem>;
}

export function UnitOfMeasureTableActionBar({ table }: UnitOfMeasureTableActionBarProps) {
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
      
      // Get full units of measure for selected IDs
      const { getUnitsOfMeasureByIds } = await import("../../_lib/export-actions");
      const { getCompanySettings } = await import("@/app/(root)/dashboard/invoices/_lib/actions");
      
      const [unitsResult, companyResult] = await Promise.all([
        getUnitsOfMeasureByIds({ ids: selectedIds }),
        getCompanySettings(),
      ]);

      if (unitsResult.error) {
        toast.error(unitsResult.error);
        return;
      }

      const units = unitsResult.data || [];
      const companyInfo = companyResult.data;

      if (units.length === 0) {
        toast.info("Aucune unité de mesure à exporter");
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Unités de Mesure</title>
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
              td {
                padding: 8px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 9px;
                color: #374151;
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
                <h2>Liste des Unités de Mesure</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${units.length} unité(s)</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Symbole</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Date de création</th>
                </tr>
              </thead>
              <tbody>
                ${units.map((unit) => `
                  <tr>
                    <td>${unit.name || "-"}</td>
                    <td>${unit.symbol || "-"}</td>
                    <td>${unit.description || "-"}</td>
                    <td>${unit.isActive ? "Actif" : "Inactif"}</td>
                    <td>${format(new Date(unit.createdAt), "dd/MM/yyyy", { locale: fr })}</td>
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

      toast.success(`Export PDF généré avec succès (${units.length} unité(s))`);
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
      
      // Get full units of measure for selected IDs
      const { getUnitsOfMeasureByIds } = await import("../../_lib/export-actions");
      
      const unitsResult = await getUnitsOfMeasureByIds({ ids: selectedIds });

      if (unitsResult.error) {
        toast.error(unitsResult.error);
        return;
      }

      const units = unitsResult.data || [];

      if (units.length === 0) {
        toast.info("Aucune unité de mesure à exporter");
        return;
      }

      // Prepare data for Excel
      const excelData = units.map((unit) => ({
        "Nom": unit.name || "-",
        "Symbole": unit.symbol || "-",
        "Description": unit.description || "-",
        "Statut": unit.isActive ? "Actif" : "Inactif",
        "Date de création": format(new Date(unit.createdAt), "dd/MM/yyyy", { locale: fr }),
        "Date de modification": format(new Date(unit.updatedAt), "dd/MM/yyyy", { locale: fr }),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre d'unités de mesure", units.length],
        ["Unités actives", units.filter(u => u.isActive).length],
        ["Unités inactives", units.filter(u => !u.isActive).length],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Units of measure sheet
      if (excelData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Unités de Mesure");
      }

      // Generate filename
      const filename = `unites_de_mesure_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${units.length} unité(s))`);
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows]);

  const onUnitOfMeasureDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteUnitsOfMeasure({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Unités de mesure supprimées");
      table.toggleAllRowsSelected(false);
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
              tooltip="Exporter les unités de mesure sélectionnées"
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
          tooltip="Supprimer les unités de mesure"
          isPending={getIsActionPending("delete")}
          onClick={onUnitOfMeasureDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
      <ExportUnitsOfMeasureDialog
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

