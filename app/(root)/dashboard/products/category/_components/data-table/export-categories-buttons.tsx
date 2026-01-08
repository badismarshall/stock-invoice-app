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
import { ExportCategoriesDialog } from "./export-categories-dialog";
import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function ExportCategoriesButtons() {
  const searchParams = useSearchParams();
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = React.useState(false);

  const handleExportPDF = React.useCallback(async () => {
    setIsExportingPDF(true);
    try {
      // Parse current search params to get filters
      const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
      const validFilters = getValidFilters(search.filters);
      
      // Get filtered categories
      const { getFilteredCategoriesForExport } = await import("../../_lib/export-actions");
      const { getCompanySettings } = await import("@/app/(root)/dashboard/invoices/_lib/actions");
      
      const [categoriesResult, companyResult] = await Promise.all([
        getFilteredCategoriesForExport({
          ...search,
          filters: validFilters,
        }),
        getCompanySettings(),
      ]);

      if (categoriesResult.error) {
        toast.error(categoriesResult.error);
        return;
      }

      const categories = categoriesResult.data || [];
      const companyInfo = companyResult.data;

      if (categories.length === 0) {
        toast.info("Aucune catégorie à exporter");
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Catégories</title>
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
                <h2>Liste des Catégories</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${categories.length} catégorie(s)</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Date de création</th>
                </tr>
              </thead>
              <tbody>
                ${categories.map((category) => `
                  <tr>
                    <td>${category.name || "-"}</td>
                    <td>${category.description || "-"}</td>
                    <td>${category.isActive ? "Actif" : "Inactif"}</td>
                    <td>${format(new Date(category.createdAt), "dd/MM/yyyy", { locale: fr })}</td>
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

      toast.success(`Export PDF généré avec succès (${categories.length} catégorie(s))`);
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
      
      // Get filtered categories
      const { getFilteredCategoriesForExport } = await import("../../_lib/export-actions");
      
      const categoriesResult = await getFilteredCategoriesForExport({
        ...search,
        filters: validFilters,
      });

      if (categoriesResult.error) {
        toast.error(categoriesResult.error);
        return;
      }

      const categories = categoriesResult.data || [];

      if (categories.length === 0) {
        toast.info("Aucune catégorie à exporter");
        return;
      }

      // Prepare data for Excel
      const excelData = categories.map((category) => ({
        "Nom": category.name || "-",
        "Description": category.description || "-",
        "Statut": category.isActive ? "Actif" : "Inactif",
        "Date de création": format(new Date(category.createdAt), "dd/MM/yyyy", { locale: fr }),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de catégories", categories.length],
        ["Catégories actives", categories.filter(c => c.isActive).length],
        ["Catégories inactives", categories.filter(c => !c.isActive).length],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Categories sheet
      if (excelData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Catégories");
      }

      // Generate filename
      const filename = `categories_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${categories.length} catégorie(s))`);
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    } finally {
      setIsExportingXLSX(false);
    }
  }, [searchParams]);

  return (
    <>
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
      <ExportCategoriesDialog
        open={isExportingPDF || isExportingXLSX}
        onOpenChange={() => {}}
        message={isExportingPDF ? "Génération du PDF en cours..." : "Génération du fichier Excel en cours..."}
      />
    </>
  );
}

