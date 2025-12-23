"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import Image from "next/image";
import logo from "@/public/logo.png";
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

interface ExportPurchasesPDFContentProps {
  purchaseOrders: PurchaseOrder[];
  companyInfo: CompanyInfo | null;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function ExportPurchasesPDFContent({ 
  purchaseOrders: initialPurchaseOrders, 
  companyInfo,
  initialStartDate,
  initialEndDate 
}: ExportPurchasesPDFContentProps) {
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
      
      // Update URL with date range
      const params = new URLSearchParams();
      params.set("startDate", range.from.getTime().toString());
      params.set("endDate", range.to.getTime().toString());
      router.push(`/dashboard/purchases/export/pdf?${params.toString()}`);
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
    router.push("/dashboard/purchases/export/pdf");
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
    if (initialStartDate && initialEndDate) {
      setDateRange({ from: initialStartDate, to: initialEndDate });
      setTempDateRange({ from: initialStartDate, to: initialEndDate });
    }
  }, [initialPurchaseOrders, initialStartDate, initialEndDate]);

  const purchaseOrders = filteredOrders;

  const handlePrint = () => {
    const printContent = document.getElementById('purchases-export-content');
    if (!printContent) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContent.innerHTML;
    const content = tempDiv.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export Commandes d'Achat</title>
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
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 10px;
              color: #1a1a1a;
              background: #ffffff;
              padding: 20px;
            }
            @media (prefers-color-scheme: dark) {
              body {
                color: #e5e5e5;
                background: #1a1a1a;
              }
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
              background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%);
              padding: 20px;
              border-radius: 8px;
            }
            @media (prefers-color-scheme: dark) {
              .header {
                background: linear-gradient(to right, #1e293b 0%, #0f172a 100%);
                border-bottom-color: #60a5fa;
              }
            }
            .company-info {
              flex: 1;
            }
            .company-logo {
              margin-bottom: 10px;
            }
            .company-logo img {
              max-height: 60px;
              width: auto;
            }
            .company-info h1 {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #1e40af;
            }
            @media (prefers-color-scheme: dark) {
              .company-info h1 {
                color: #93c5fd;
              }
            }
            .company-info p {
              font-size: 10px;
              margin: 3px 0;
              line-height: 1.5;
              color: #4b5563;
            }
            @media (prefers-color-scheme: dark) {
              .company-info p {
                color: #9ca3af;
              }
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
            @media (prefers-color-scheme: dark) {
              .export-title h2 {
                color: #93c5fd;
              }
            }
            .export-title p {
              font-size: 10px;
              color: #6b7280;
              margin: 2px 0;
            }
            @media (prefers-color-scheme: dark) {
              .export-title p {
                color: #9ca3af;
              }
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 9px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border-radius: 6px;
              overflow: hidden;
            }
            thead {
              background: linear-gradient(to bottom, #3b82f6, #2563eb);
              color: #ffffff;
            }
            @media (prefers-color-scheme: dark) {
              thead {
                background: linear-gradient(to bottom, #1e40af, #1e3a8a);
              }
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
            @media (prefers-color-scheme: dark) {
              th {
                border-bottom-color: #3b82f6;
              }
            }
            th.text-right {
              text-align: right;
            }
            th.text-center {
              text-align: center;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 9px;
              color: #374151;
            }
            @media (prefers-color-scheme: dark) {
              td {
                border-bottom-color: #374151;
                color: #d1d5db;
              }
            }
            td.text-right {
              text-align: right;
            }
            tbody tr {
              transition: background-color 0.2s;
            }
            tbody tr:nth-child(even) {
              background-color: #f9fafb;
            }
            @media (prefers-color-scheme: dark) {
              tbody tr:nth-child(even) {
                background-color: #1f2937;
              }
            }
            tbody tr:hover {
              background-color: #f3f4f6;
            }
            @media (prefers-color-scheme: dark) {
              tbody tr:hover {
                background-color: #374151;
              }
            }
            tfoot {
              border-top: 3px solid #3b82f6;
              background-color: #eff6ff;
            }
            @media (prefers-color-scheme: dark) {
              tfoot {
                border-top-color: #60a5fa;
                background-color: #1e3a8a;
              }
            }
            tfoot td {
              font-weight: 700;
              padding: 12px 8px;
              font-size: 11px;
              color: #1e40af;
            }
            @media (prefers-color-scheme: dark) {
              tfoot td {
                color: #93c5fd;
              }
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 9px;
              color: #6b7280;
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 6px;
            }
            @media (prefers-color-scheme: dark) {
              .footer {
                border-top-color: #374151;
                color: #9ca3af;
                background-color: #111827;
              }
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="export-container">
            ${content}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimer / Enregistrer en PDF
          </Button>
        </div>
      </div>

      <div id="purchases-export-content" className="bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="header">
          <div className="company-info">
            {companyInfo?.logo && (
              <div className="company-logo mb-3">
                <Image
                  src={companyInfo.logo}
                  alt="Logo"
                  width={70}
                  height={70}
                  className="object-contain rounded-lg"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-primary mb-2">{companyInfo?.name || "Sirof Algeria"}</h1>
            <div className="space-y-1">
              {companyInfo?.address && <p className="text-sm text-muted-foreground">{companyInfo.address}</p>}
              {companyInfo?.phone && <p className="text-sm text-muted-foreground">Tél: {companyInfo.phone}</p>}
              {companyInfo?.email && <p className="text-sm text-muted-foreground">Email: {companyInfo.email}</p>}
              <div className="flex gap-4 mt-2">
                {companyInfo?.nif && <p className="text-sm text-muted-foreground">NIF: {companyInfo.nif}</p>}
                {companyInfo?.rc && <p className="text-sm text-muted-foreground">RC: {companyInfo.rc}</p>}
              </div>
            </div>
          </div>
          <div className="export-title">
            <h2 className="text-2xl font-bold text-primary mb-3">Liste des Commandes d'Achat</h2>
            <div className="space-y-1">
              <p className="text-sm font-medium">Date d'export: {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
              {dateRange?.from && dateRange?.to && (
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Période: {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                </p>
              )}
              <p className="text-sm font-semibold text-primary mt-2">
                Total: {purchaseOrders.length} commande(s)
              </p>
            </div>
          </div>
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
          (() => {
            // Flatten all items from all purchase orders into a single array
            const allItems = purchaseOrders.flatMap((order) =>
              order.items.map((item) => ({
                ...item,
                orderNumber: order.orderNumber,
                orderDate: order.orderDate,
                supplierName: order.supplierName || "-",
                status: order.status,
              }))
            );

            // Calculate totals
            const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = allItems.reduce((sum, item) => sum + item.lineTotal, 0);

            return (
              <table>
                <thead>
                  <tr>
                    <th>N° Commande</th>
                    <th>Date</th>
                    <th>Fournisseur</th>
                    <th>Code Produit</th>
                    <th>Produit</th>
                    <th className="text-right">Quantité</th>
                    <th className="text-right">Prix unitaire</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((item, index) => (
                    <tr key={`${item.orderNumber}-${item.id}-${index}`}>
                      <td>{item.orderNumber}</td>
                      <td>{format(item.orderDate, "dd/MM/yyyy", { locale: fr })}</td>
                      <td>{item.supplierName}</td>
                      <td className="product-code">{item.productCode || "-"}</td>
                      <td>{item.productName || "-"}</td>
                      <td className="text-right">{item.quantity.toFixed(2)}</td>
                      <td className="text-right">{item.unitCost.toFixed(2)} DZD</td>
                      <td className="text-right">{item.lineTotal.toFixed(2)} DZD</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-right">
                      <strong>Totaux:</strong>
                    </td>
                    <td className="text-right">
                      <strong>{totalQuantity.toFixed(2)}</strong>
                    </td>
                    <td></td>
                    <td className="text-right">
                      <strong>{totalAmount.toFixed(2)} DZD</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            );
          })()
        )}

        <div className="footer">
          <p>Document généré le {format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
          <p>Total des commandes: {purchaseOrders.length}</p>
          <p>
            Total des lignes: {purchaseOrders.reduce((sum, order) => sum + order.items.length, 0)}
          </p>
          <p>Montant total: {purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)} DZD</p>
        </div>
      </div>
    </div>
  );
}


