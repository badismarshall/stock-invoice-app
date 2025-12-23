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

interface DeliveryNote {
  id: string;
  noteNumber: string;
  noteType: string;
  clientId: string | null;
  clientName: string | null;
  clientAddress: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  noteDate: Date;
  status: string;
  currency: string | null;
  destinationCountry: string | null;
  deliveryLocation: string | null;
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
    unitPrice: number;
    discountPercent: number;
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

interface ExportSalesXLSXContentProps {
  deliveryNotes: DeliveryNote[];
  companyInfo: CompanyInfo | null;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function ExportSalesXLSXContent({ 
  deliveryNotes: initialDeliveryNotes, 
  companyInfo,
  initialStartDate,
  initialEndDate 
}: ExportSalesXLSXContentProps) {
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
  
  const [filteredNotes, setFilteredNotes] = React.useState<DeliveryNote[]>(initialDeliveryNotes);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [tempDateRange, setTempDateRange] = React.useState<DateRange | undefined>(dateRange);

  // Apply filter when user confirms selection (both dates selected)
  const applyDateFilter = React.useCallback(async (range: DateRange) => {
    if (!range.from || !range.to) {
      return;
    }

    setIsFiltering(true);
    try {
      const { getAllDeliveryNotesForExport } = await import("../../../_lib/actions");
      const result = await getAllDeliveryNotesForExport({
        startDate: range.from,
        endDate: range.to,
      });
      setFilteredNotes(result.data || []);
      setDateRange(range);
      
      // Update URL with date range (use replace to avoid adding to history)
      const params = new URLSearchParams();
      params.set("startDate", range.from.getTime().toString());
      params.set("endDate", range.to.getTime().toString());
      router.replace(`/dashboard/sales/export/xlsx?${params.toString()}`);
    } catch (error) {
      console.error("Error filtering delivery notes", error);
      toast.error("Erreur lors du filtrage des bons de livraison");
    } finally {
      setIsFiltering(false);
    }
  }, [router]);

  // Clear filter
  const clearFilter = React.useCallback(() => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    setFilteredNotes(initialDeliveryNotes);
    router.replace("/dashboard/sales/export/xlsx");
  }, [initialDeliveryNotes, router]);

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

  // Initialize filtered notes from props (server-side filtered data)
  React.useEffect(() => {
    setFilteredNotes(initialDeliveryNotes);
    
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
  }, [initialDeliveryNotes, initialStartDate, initialEndDate, searchParams]);

  const deliveryNotes = filteredNotes;

  // Export to XLSX
  const handleExport = () => {
    try {
      // Flatten all items from all delivery notes into a single array
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

      // Add summary sheet
      const currency = deliveryNotes[0]?.currency || "DZD";
      const totalAmount = deliveryNotes.reduce((sum, note) => 
        sum + note.items.reduce((itemSum, item) => itemSum + item.lineTotal, 0), 0
      );

      const summaryData = [
        ["EXPORT DES BONS DE LIVRAISON"],
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
        ["Total bons de livraison:", deliveryNotes.length],
        [
          "Total lignes:",
          deliveryNotes.reduce((sum, note) => sum + note.items.length, 0),
        ],
        [
          "Montant total:",
          totalAmount.toFixed(2) + ` ${currency}`,
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
          { wch: 15 }, // N° Bon
          { wch: 12 }, // Date
          { wch: 25 }, // Client
          { wch: 15 }, // Code Produit
          { wch: 30 }, // Produit
          { wch: 12 }, // Quantité
          { wch: 15 }, // Prix unitaire
          { wch: 12 }, // Remise %
          { wch: 15 }, // Total
        ];
        ws["!cols"] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Produits");
      }

      // Generate filename
      const filename = `bons_livraison_${format(new Date(), "yyyy-MM-dd", { locale: fr })}${dateRange?.from && dateRange?.to ? `_${format(dateRange.from, "yyyy-MM-dd", { locale: fr })}_${format(dateRange.to, "yyyy-MM-dd", { locale: fr })}` : ""}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      toast.success("Export XLSX généré avec succès");
    } catch (error) {
      console.error("Error exporting to XLSX", error);
      toast.error("Erreur lors de l'export XLSX");
    }
  };

  const statusLabels: Record<string, string> = {
    active: "Actif",
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
          <Button onClick={handleExport} className="flex items-center gap-2" disabled={isFiltering || deliveryNotes.length === 0}>
            <Download className="h-4 w-4" />
            Exporter en XLSX
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Export Excel - Bons de Livraison</h2>
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

          {deliveryNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">Aucun bon de livraison trouvé</p>
              <p className="text-sm text-muted-foreground mt-2">Essayez de modifier la plage de dates</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total bons de livraison</p>
                  <p className="text-2xl font-bold text-primary">{deliveryNotes.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total lignes</p>
                  <p className="text-2xl font-bold text-primary">
                    {deliveryNotes.reduce((sum, note) => sum + note.items.length, 0)}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-2xl font-bold text-primary">
                    {deliveryNotes.reduce((sum, note) => sum + note.items.reduce((itemSum, item) => itemSum + item.lineTotal, 0), 0).toFixed(2)} {deliveryNotes[0]?.currency || "DZD"}
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Le fichier Excel contiendra :</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Une feuille "Résumé" avec les informations de l'entreprise et les statistiques</li>
                  <li>Une feuille "Produits" avec tous les produits de tous les bons de livraison</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

