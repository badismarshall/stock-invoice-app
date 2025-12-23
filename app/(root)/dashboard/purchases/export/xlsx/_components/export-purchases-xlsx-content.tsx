"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { DateRange } from "react-day-picker";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  orderDate: Date;
  receptionDate: Date | null;
  status: string;
  supplierOrderNumber: string | null;
  totalAmount: number;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productName: string | null;
    productCode: string | null;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
}

interface CompanyInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  nif: string | null;
  rc: string | null;
  logo: string | null;
}

interface ExportPurchasesXLSXContentProps {
  purchaseOrders: PurchaseOrder[];
  companyInfo: CompanyInfo | null;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function ExportPurchasesXLSXContent({ 
  purchaseOrders: initialPurchaseOrders, 
  companyInfo,
  initialStartDate,
  initialEndDate 
}: ExportPurchasesXLSXContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize date range from URL params or props
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    if (initialStartDate && initialEndDate) {
      return { from: initialStartDate, to: initialEndDate };
    }
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    if (startParam && endParam) {
      return {
        from: new Date(Number(startParam)),
        to: new Date(Number(endParam)),
      };
    }
    return undefined;
  });
  
  const [filteredOrders, setFilteredOrders] = React.useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [tempDateRange, setTempDateRange] = React.useState<DateRange | undefined>(dateRange);

  // Apply filter when user confirms selection (both dates selected)
  const applyDateFilter = React.useCallback(async (range: DateRange) => {
    if (!range.from || !range.to) {
      return;
    }

    setIsFiltering(true);
    try {
      const { getAllPurchaseOrdersForExport } = await import("../../../_lib/actions");
      const result = await getAllPurchaseOrdersForExport({
        startDate: range.from,
        endDate: range.to,
      });
      setFilteredOrders(result.data || []);
      setDateRange(range);
      
      // Update URL with date range (use replace to avoid adding to history)
      const params = new URLSearchParams();
      params.set("startDate", range.from.getTime().toString());
      params.set("endDate", range.to.getTime().toString());
      router.replace(`/dashboard/purchases/export/xlsx?${params.toString()}`);
    } catch (error) {
      console.error("Error filtering purchase orders", error);
      toast.error("Erreur lors du filtrage des commandes d'achat");
    } finally {
      setIsFiltering(false);
    }
  }, [router]);

  // Clear filter
  const clearFilter = React.useCallback(() => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    setFilteredOrders(initialPurchaseOrders);
    router.replace("/dashboard/purchases/export/xlsx");
  }, [initialPurchaseOrders, router]);

  // Handle date selection in calendar
  const handleDateSelect = React.useCallback((range: DateRange | undefined) => {
    setTempDateRange(range);
    
    // Auto-apply when both dates are selected
    if (range?.from && range?.to) {
      // Small delay to ensure both dates are set
      setTimeout(() => {
        applyDateFilter(range);
      }, 100);
    }
  }, [applyDateFilter]);

  // Initialize filtered orders from props (server-side filtered data)
  React.useEffect(() => {
    setFilteredOrders(initialPurchaseOrders);
    
    // Sync date range from props or URL params
    if (initialStartDate && initialEndDate) {
      setDateRange({ from: initialStartDate, to: initialEndDate });
      setTempDateRange({ from: initialStartDate, to: initialEndDate });
    } else {
      // Check URL params if props don't have dates
      const startParam = searchParams.get("startDate");
      const endParam = searchParams.get("endDate");
      if (startParam && endParam) {
        const startDate = new Date(Number(startParam));
        const endDate = new Date(Number(endParam));
        setDateRange({ from: startDate, to: endDate });
        setTempDateRange({ from: startDate, to: endDate });
      } else if (!startParam && !endParam) {
        // Clear if no params in URL
        setDateRange(undefined);
        setTempDateRange(undefined);
      }
    }
  }, [initialPurchaseOrders, initialStartDate, initialEndDate, searchParams]);

  const purchaseOrders = filteredOrders;

  // Export to XLSX
  const handleExport = () => {
    try {
      // Flatten all items from all purchase orders into a single array
      const allItems = purchaseOrders.flatMap((order) =>
        order.items.map((item) => ({
          "N° Commande": order.orderNumber,
          "Date": format(order.orderDate, "dd/MM/yyyy", { locale: fr }),
          "Fournisseur": order.supplierName || "-",
          "Code Produit": item.productCode || "-",
          "Produit": item.productName || "-",
          "Quantité": item.quantity,
          "Prix unitaire": item.unitCost,
          "Total": item.lineTotal,
        }))
      );

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add summary sheet
      const summaryData = [
        ["EXPORT DES COMMANDES D'ACHAT"],
        [""],
        ["Informations de l'entreprise"],
        ["Nom:", companyInfo?.name || "Sirof Algeria"],
        ["Adresse:", companyInfo?.address || "-"],
        ["Téléphone:", companyInfo?.phone || "-"],
        ["Email:", companyInfo?.email || "-"],
        ["NIF:", companyInfo?.nif || "-"],
        ["RC:", companyInfo?.rc || "-"],
        [""],
        ["Informations de l'export"],
        ["Date d'export:", format(new Date(), "dd MMMM yyyy", { locale: fr })],
        ...(dateRange?.from && dateRange?.to
          ? [
              [
                "Période:",
                `${format(dateRange.from, "dd/MM/yyyy", { locale: fr })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: fr })}`,
              ],
            ]
          : []),
        ["Total commandes:", purchaseOrders.length],
        [
          "Total lignes:",
          purchaseOrders.reduce((sum, order) => sum + order.items.length, 0),
        ],
        [
          "Montant total:",
          purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2) + " DZD",
        ],
        [""],
        ["Détails des produits"],
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Résumé");

      // Add data sheet
      if (allItems.length > 0) {
        const ws = XLSX.utils.json_to_sheet(allItems);
        
        // Set column widths
        const colWidths = [
          { wch: 15 }, // N° Commande
          { wch: 12 }, // Date
          { wch: 25 }, // Fournisseur
          { wch: 15 }, // Code Produit
          { wch: 30 }, // Produit
          { wch: 12 }, // Quantité
          { wch: 15 }, // Prix unitaire
          { wch: 15 }, // Total
        ];
        ws["!cols"] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Produits");
      }

      // Generate filename
      const filename = `commandes_achat_${format(new Date(), "yyyy-MM-dd", { locale: fr })}${dateRange?.from && dateRange?.to ? `_${format(dateRange.from, "yyyy-MM-dd", { locale: fr })}_${format(dateRange.to, "yyyy-MM-dd", { locale: fr })}` : ""}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      toast.success("Export XLSX généré avec succès");
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    received: "Reçu",
    cancelled: "Annulé",
  };

  return (
    <div className="min-h-screen bg-background flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
                disabled={isFiltering}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {isFiltering ? (
                  <span>Chargement...</span>
                ) : dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: fr })
                  )
                ) : (
                  <span>Sélectionner une plage de dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={tempDateRange?.from || dateRange?.from || new Date()}
                selected={tempDateRange || dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                captionLayout="dropdown"
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              disabled={isFiltering}
            >
              Effacer le filtre
            </Button>
          )}
          <Button onClick={handleExport} className="flex items-center gap-2" disabled={isFiltering || purchaseOrders.length === 0}>
            <Download className="h-4 w-4" />
            Exporter en XLSX
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Export Excel - Commandes d'Achat</h2>
            <p className="text-sm text-muted-foreground">
              Date d'export: {format(new Date(), "dd MMMM yyyy", { locale: fr })}
            </p>
            {dateRange?.from && dateRange?.to && (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                Période: {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
              </p>
            )}
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">Aucune commande d'achat trouvée</p>
              <p className="text-sm text-muted-foreground mt-2">Essayez de modifier la plage de dates</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total commandes</p>
                  <p className="text-2xl font-bold text-primary">{purchaseOrders.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total lignes</p>
                  <p className="text-2xl font-bold text-primary">
                    {purchaseOrders.reduce((sum, order) => sum + order.items.length, 0)}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-2xl font-bold text-primary">
                    {purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)} DZD
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Le fichier Excel contiendra :</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Une feuille "Résumé" avec les informations de l'entreprise et les statistiques</li>
                  <li>Une feuille "Produits" avec tous les produits de toutes les commandes</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

