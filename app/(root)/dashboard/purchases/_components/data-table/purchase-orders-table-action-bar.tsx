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
import { ExportPurchaseOrdersDialog } from "./export-purchase-orders-dialog";
import type { PurchaseOrderDTOItem } from "@/data/purchase-order/purchase-order.dto";
import { deletePurchaseOrders } from "../../_lib/actions";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actions = [
  "export-pdf",
  "export-xlsx",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface PurchaseOrdersTableActionBarProps {
  table: Table<PurchaseOrderDTOItem>;
}

export function PurchaseOrdersTableActionBar({ table }: PurchaseOrdersTableActionBarProps) {
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
      
      // Get full purchase orders for selected IDs
      const { getPurchaseOrdersByIds } = await import("../../_lib/export-actions");
      const { getCompanySettings } = await import("@/app/(root)/dashboard/invoices/_lib/actions");
      
      const [ordersResult, companyResult] = await Promise.all([
        getPurchaseOrdersByIds({ ids: selectedIds }),
        getCompanySettings(),
      ]);

      if (ordersResult.error) {
        toast.error(ordersResult.error);
        return;
      }

      const orders = ordersResult.data || [];
      const companyInfo = companyResult.data;

      if (orders.length === 0) {
        toast.info("Aucun bon de commande à exporter");
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export Bons de Commande</title>
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
              .order-section {
                margin-bottom: 40px;
                page-break-inside: avoid;
              }
              .order-header {
                background: linear-gradient(to bottom, #3b82f6, #2563eb);
                color: #ffffff;
                padding: 12px;
                margin-bottom: 15px;
                border-radius: 4px;
              }
              .order-header h3 {
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 5px;
              }
              .order-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                font-size: 9px;
              }
              .order-info-left, .order-info-right {
                flex: 1;
              }
              .order-info-left p, .order-info-right p {
                margin: 3px 0;
                color: #374151;
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
              .order-total {
                text-align: right;
                margin-top: 10px;
                font-size: 11px;
                font-weight: 700;
                color: #1e40af;
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
                <h2>Liste des Bons de Commande</h2>
                <p>Date d'export: ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                <p>Total: ${orders.length} bon(s) de commande</p>
              </div>
            </div>
            ${orders.map((order) => `
              <div class="order-section">
                <div class="order-header">
                  <h3>Bon de Commande ${order.orderNumber}</h3>
                </div>
                <div class="order-info">
                  <div class="order-info-left">
                    <p><strong>Fournisseur:</strong> ${order.supplierName || "-"}</p>
                    ${order.supplierAddress ? `<p>${order.supplierAddress}</p>` : ""}
                    ${order.supplierPhone ? `<p>Tél: ${order.supplierPhone}</p>` : ""}
                    ${order.supplierEmail ? `<p>Email: ${order.supplierEmail}</p>` : ""}
                  </div>
                  <div class="order-info-right">
                    <p><strong>Date commande:</strong> ${format(order.orderDate, "dd/MM/yyyy", { locale: fr })}</p>
                    ${order.receptionDate ? `<p><strong>Date réception:</strong> ${format(order.receptionDate, "dd/MM/yyyy", { locale: fr })}</p>` : ""}
                    <p><strong>Statut:</strong> ${order.status === "pending" ? "En attente" : order.status === "received" ? "Reçu" : "Annulé"}</p>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th class="text-right">Qté</th>
                      <th class="text-right">Prix unitaire</th>
                      <th class="text-right">TVA %</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map((item: any) => `
                      <tr>
                        <td>${item.productCode && item.productName ? `${item.productCode} - ${item.productName}` : item.productName || item.productCode || "-"}</td>
                        <td class="text-right">${item.quantity.toFixed(3).replace(',', '.')}</td>
                        <td class="text-right">${item.unitCost.toFixed(2).replace(',', '.')} DZD</td>
                        <td class="text-right">${item.taxRate.toFixed(2).replace(',', '.')} %</td>
                        <td class="text-right">${item.lineTotal.toFixed(2).replace(',', '.')} DZD</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
                <div class="order-total">
                  <p>Total TTC: ${order.totalAmount.toFixed(2).replace(',', '.')} DZD</p>
                </div>
              </div>
            `).join("")}
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

      toast.success(`Export PDF généré avec succès (${orders.length} bon(s) de commande)`);
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
      
      // Get full purchase orders for selected IDs
      const { getPurchaseOrdersByIds } = await import("../../_lib/export-actions");
      
      const ordersResult = await getPurchaseOrdersByIds({ ids: selectedIds });

      if (ordersResult.error) {
        toast.error(ordersResult.error);
        return;
      }

      const orders = ordersResult.data || [];

      if (orders.length === 0) {
        toast.info("Aucun bon de commande à exporter");
        return;
      }

      // Prepare data for Excel - flatten orders with items
      const excelData: any[] = [];
      orders.forEach((order) => {
        if (order.items.length === 0) {
          excelData.push({
            "N° Commande": order.orderNumber,
            "Fournisseur": order.supplierName || "-",
            "Date commande": format(order.orderDate, "dd/MM/yyyy", { locale: fr }),
            "Date réception": order.receptionDate ? format(order.receptionDate, "dd/MM/yyyy", { locale: fr }) : "-",
            "Statut": order.status === "pending" ? "En attente" : order.status === "received" ? "Reçu" : "Annulé",
            "Produit": "-",
            "Code produit": "-",
            "Quantité": null,
            "Prix unitaire": null,
            "TVA %": null,
            "Total ligne": null,
            "Montant total": order.totalAmount,
            "Notes": order.notes || "-",
          });
        } else {
          order.items.forEach((item: any) => {
            excelData.push({
              "N° Commande": order.orderNumber,
              "Fournisseur": order.supplierName || "-",
              "Date commande": format(order.orderDate, "dd/MM/yyyy", { locale: fr }),
              "Date réception": order.receptionDate ? format(order.receptionDate, "dd/MM/yyyy", { locale: fr }) : "-",
              "Statut": order.status === "pending" ? "En attente" : order.status === "received" ? "Reçu" : "Annulé",
              "Produit": item.productName || "-",
              "Code produit": item.productCode || "-",
              "Quantité": item.quantity,
              "Prix unitaire": item.unitCost,
              "TVA %": item.taxRate,
              "Total ligne": item.lineTotal,
              "Montant total": order.totalAmount,
              "Notes": order.notes || "-",
            });
          });
        }
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Résumé de l'Export"],
        ["Date d'export", format(new Date(), "dd/MM/yyyy", { locale: fr })],
        ["Nombre de bons de commande", orders.length],
        ["En attente", orders.filter(o => o.status === "pending").length],
        ["Reçus", orders.filter(o => o.status === "received").length],
        ["Annulés", orders.filter(o => o.status === "cancelled").length],
        ["Montant total", orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2) + " DZD"],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Orders sheet
      if (excelData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "Bons de Commande");
      }

      // Generate filename
      const filename = `bons_de_commande_${format(new Date(), "yyyy-MM-dd", { locale: fr })}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Export XLSX généré avec succès (${orders.length} bon(s) de commande)`);
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    } finally {
      setIsExporting(false);
      setCurrentAction(null);
    }
  }, [rows]);

  const onPurchaseOrderDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deletePurchaseOrders({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Bons de commande supprimés");
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
              tooltip="Exporter les bons de commande sélectionnés"
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
          tooltip="Supprimer les bons de commande"
          isPending={getIsActionPending("delete")}
          onClick={onPurchaseOrderDelete}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
      <ExportPurchaseOrdersDialog
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

