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
import { ExportDeliveryNotesDialog } from "./export-delivery-notes-dialog";
import { searchParamsCache } from "../../_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function ExportDeliveryNotesButtons() {
  const searchParams = useSearchParams();
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = React.useState(false);

  const handleExportPDF = React.useCallback(async () => {
    setIsExportingPDF(true);
    try {
      // Parse current search params to get filters
      const search = searchParamsCache.parse(Object.fromEntries(searchParams.entries()));
      const validFilters = getValidFilters(search.filters);
      
      // Get filtered delivery notes
      const { getFilteredDeliveryNotesForExport } = await import("../../_lib/export-actions");
      const { getCompanySettings } = await import("@/app/(root)/dashboard/invoices/_lib/actions");
      
      const [notesResult, companyResult] = await Promise.all([
        getFilteredDeliveryNotesForExport({
          ...search,
          filters: validFilters,
          noteType: ["local"],
        }),
        getCompanySettings(),
      ]);

      if (notesResult.error) {
        toast.error(notesResult.error);
        return;
      }

      const deliveryNotes = notesResult.data || [];
      const companyInfo = companyResult.data;

      if (deliveryNotes.length === 0) {
        toast.info("Aucun bon de livraison à exporter");
        return;
      }

      // Generate PDF content
      const allItems = deliveryNotes.flatMap((note) =>
        note.items.map((item) => ({
          ...item,
          noteNumber: note.noteNumber,
          noteDate: note.noteDate,
          clientName: note.clientName || "-",
          status: note.status,
        }))
      );

      const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = allItems.reduce((sum, item) => sum + item.lineTotal, 0);

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Bons de Livraison</title>
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
              .totals-summary {
                margin-top: 20px;
                padding: 12px;
                background-color: #eff6ff;
                border-top: 3px solid #3b82f6;
                display: flex;
                justify-content: flex-end;
                gap: 20px;
                font-weight: 700;
                font-size: 11px;
                color: #1e40af;
                page-break-inside: avoid;
                break-inside: avoid;
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
                <h2>Liste des Bons de Livraison</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${deliveryNotes.length} bon(s) de livraison</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>N° Bon</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Code Produit</th>
                  <th>Produit</th>
                  <th class="text-right">Quantité</th>
                  <th class="text-right">Prix unitaire</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${allItems.map((item) => `
                  <tr>
                    <td>${item.noteNumber}</td>
                    <td>${format(item.noteDate, "dd/MM/yyyy", { locale: fr })}</td>
                    <td>${item.clientName}</td>
                    <td>${item.productCode || "-"}</td>
                    <td>${item.productName || "-"}</td>
                    <td class="text-right">${item.quantity.toFixed(2)}</td>
                    <td class="text-right">${item.unitPrice.toFixed(2)} ${deliveryNotes[0]?.currency || "DZD"}</td>
                    <td class="text-right">${item.lineTotal.toFixed(2)} ${deliveryNotes[0]?.currency || "DZD"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="totals-summary">
              <div style="text-align: right;">
                <strong>Totaux:</strong>
              </div>
              <div style="text-align: right; min-width: 80px;">
                <strong>${totalQuantity.toFixed(2)}</strong>
              </div>
              <div style="text-align: right; min-width: 120px;">
                <strong>${totalAmount.toFixed(2)} ${deliveryNotes[0]?.currency || "DZD"}</strong>
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

      toast.success(`Export PDF généré avec succès (${deliveryNotes.length} bon(s) de livraison)`);
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
      
      // Get filtered delivery notes
      const { getFilteredDeliveryNotesForExport } = await import("../../_lib/export-actions");
      
      const notesResult = await getFilteredDeliveryNotesForExport({
        ...search,
        filters: validFilters,
        noteType: ["local"],
      });

      if (notesResult.error) {
        toast.error(notesResult.error);
        return;
      }

      const deliveryNotes = notesResult.data || [];

      if (deliveryNotes.length === 0) {
        toast.info("Aucun bon de livraison à exporter");
        return;
      }

      // Flatten all items
      const allItems = deliveryNotes.flatMap((note) =>
        note.items.map((item) => ({
          "N° Bon": note.noteNumber,
          "Date": format(note.noteDate, "dd/MM/yyyy", { locale: fr }),
          "Client": note.clientName || "-",
          "Code Produit": item.productCode || "-",
          "Produit": item.productName || "-",
          "Quantité": item.quantity,
          "Prix unitaire": item.unitPrice,
          "Remise %": item.discountPercent,
          "Total": item.lineTotal,
        }))
      );

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de bons de livraison", deliveryNotes.length],
        ["Nombre total de lignes", allItems.length],
        ["Quantité totale", allItems.reduce((sum, item) => sum + item.Quantité, 0)],
        ["Montant total", allItems.reduce((sum, item) => sum + item.Total, 0)],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Items sheet
      if (allItems.length > 0) {
        const ws = XLSX.utils.json_to_sheet(allItems);
        XLSX.utils.book_append_sheet(wb, ws, "Produits");
      }

      // Generate filename
      const filename = `bons_livraison_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${deliveryNotes.length} bon(s) de livraison)`);
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
      <ExportDeliveryNotesDialog
        open={isExportingPDF || isExportingXLSX}
        onOpenChange={() => {}}
        message={isExportingPDF ? "Génération du PDF en cours..." : "Génération du fichier Excel en cours..."}
      />
    </>
  );
}

