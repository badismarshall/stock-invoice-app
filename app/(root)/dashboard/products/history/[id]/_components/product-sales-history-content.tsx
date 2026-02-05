"use client";

import * as React from "react";
import { History, ArrowLeft, Users, ShoppingBag, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { getProductSalesHistory, getProductById } from "../../../_lib/actions";
import { formatDate } from "@/lib/data-table/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SalesHistoryItem = {
  deliveryNote: {
    id: string;
    noteNumber: string;
    noteType: string | null;
    noteDate: Date | string;
    status: string | null;
    currency: string | null;
  };
  client: {
    id: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  item: {
    id: string;
    quantity: string;
    unitPrice: string;
    discountPercent: string | null;
    lineTotal: string;
  };
};

interface ProductSalesHistoryContentProps {
  productId: string;
}

export function ProductSalesHistoryContent({ productId }: ProductSalesHistoryContentProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [productLoading, setProductLoading] = React.useState(true);
  const [salesHistory, setSalesHistory] = React.useState<SalesHistoryItem[]>([]);
  const [product, setProduct] = React.useState<{ name: string; code: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setProductLoading(true);
      setError(null);
      
      try {
        // Fetch product info
        const productResult = await getProductById({ id: productId });
        if (productResult.error || !productResult.data) {
          setError(productResult.error || "Produit non trouvé");
          setProductLoading(false);
          return;
        }
        setProduct({
          name: productResult.data.name,
          code: productResult.data.code,
        });
        setProductLoading(false);

        // Fetch sales history
        const salesResult = await getProductSalesHistory({ productId });
        if (salesResult.error) {
          setError(salesResult.error);
          setSalesHistory([]);
        } else {
          setSalesHistory(salesResult.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
        setSalesHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const formatCurrency = (value: string | null, currency: string | null = "DZD") => {
    const numValue = value ? parseFloat(value) : 0;
    return numValue.toLocaleString("fr-FR", {
      style: "currency",
      currency: currency || "DZD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatQuantity = (value: string) => {
    const numValue = parseFloat(value);
    return numValue.toLocaleString("fr-FR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  const totalQuantity = salesHistory.reduce((sum, item) => sum + parseFloat(item.item.quantity), 0);
  const totalAmount = salesHistory.reduce((sum, item) => sum + parseFloat(item.item.lineTotal), 0);
  const uniqueClients = new Set(salesHistory.map((item) => item.client?.id).filter(Boolean)).size;

  // Group sales by client
  const clientsSummary = React.useMemo(() => {
    const clientMap = new Map<string, {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      orderCount: number;
      totalQuantity: number;
      totalAmount: number;
      lastPurchaseDate: Date | null;
      currency: string;
    }>();

    salesHistory.forEach((sale) => {
      const clientId = sale.client?.id;
      if (!clientId || !sale.client?.name) return;

      const noteDate =
        typeof sale.deliveryNote.noteDate === "string"
          ? new Date(sale.deliveryNote.noteDate + "T00:00:00")
          : new Date(sale.deliveryNote.noteDate);
      const currency = sale.deliveryNote.currency || "DZD";

      if (clientMap.has(clientId)) {
        const existing = clientMap.get(clientId)!;
        existing.orderCount += 1;
        existing.totalQuantity += parseFloat(sale.item.quantity);
        existing.totalAmount += parseFloat(sale.item.lineTotal);
        if (!existing.lastPurchaseDate || noteDate > existing.lastPurchaseDate) {
          existing.lastPurchaseDate = noteDate;
        }
      } else {
        clientMap.set(clientId, {
          id: clientId,
          name: sale.client.name,
          phone: sale.client.phone,
          email: sale.client.email,
          address: sale.client.address,
          orderCount: 1,
          totalQuantity: parseFloat(sale.item.quantity),
          totalAmount: parseFloat(sale.item.lineTotal),
          lastPurchaseDate: noteDate,
          currency,
        });
      }
    });

    return Array.from(clientMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [salesHistory]);

  if (productLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="size-6" />
              Historique des ventes
            </h1>
            {product && (
              <p className="text-muted-foreground mt-1">
                {product.name} ({product.code})
              </p>
            )}
          </div>
        </div>
      </div>

      {salesHistory.length === 0 ? (
        <div className="flex items-center justify-center py-12 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Aucune vente trouvée pour ce produit
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Nombre de ventes</p>
              <p className="text-3xl font-semibold">{salesHistory.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Clients uniques</p>
              <p className="text-3xl font-semibold">{uniqueClients}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Quantité totale</p>
              <p className="text-3xl font-semibold">{formatQuantity(totalQuantity.toString())}</p>
            </div>
          </div>

          {/* Clients List Table */}
          {clientsSummary.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Clients ayant acheté ce produit</h2>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-center">Commandes</TableHead>
                        <TableHead className="text-right">Quantité totale</TableHead>
                        <TableHead className="text-right">Montant total</TableHead>
                        <TableHead className="text-center">Dernière commande</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientsSummary.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold">{client.name}</p>
                              {client.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {client.phone}
                                </p>
                              )}
                              {client.email && (
                                <p className="text-xs text-muted-foreground">
                                  {client.email}
                                </p>
                              )}
                              {client.address && (
                                <p className="text-xs text-muted-foreground">
                                  {client.address}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <ShoppingBag className="size-4 text-muted-foreground" />
                              <span className="font-semibold">{client.orderCount}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatQuantity(client.totalQuantity.toString())}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-semibold text-primary">
                                {formatCurrency(client.totalAmount.toString(), client.currency)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {client.lastPurchaseDate ? (
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <Calendar className="size-3 text-muted-foreground" />
                                <span>{formatDate(client.lastPurchaseDate)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Sales Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="size-5 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Détail des ventes</h2>
            </div>
            <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[120px]">N° Bon</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="w-[100px] text-right">Quantité</TableHead>
                    <TableHead className="w-[120px] text-right">Prix unitaire</TableHead>
                    <TableHead className="w-[100px] text-right">Remise</TableHead>
                    <TableHead className="w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.map((sale) => {
                    const noteDate =
                      typeof sale.deliveryNote.noteDate === "string"
                        ? new Date(sale.deliveryNote.noteDate + "T00:00:00")
                        : new Date(sale.deliveryNote.noteDate);
                    const currency = sale.deliveryNote.currency || "DZD";
                    const discountPercent = sale.item.discountPercent
                      ? parseFloat(sale.item.discountPercent)
                      : 0;

                    return (
                      <TableRow key={sale.item.id}>
                        <TableCell className="font-medium">
                          {formatDate(noteDate)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {sale.deliveryNote.noteNumber}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{sale.client?.name || "N/A"}</p>
                            {sale.client?.phone && (
                              <p className="text-xs text-muted-foreground">
                                {sale.client.phone}
                              </p>
                            )}
                            {sale.client?.email && (
                              <p className="text-xs text-muted-foreground">
                                {sale.client.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(sale.item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.item.unitPrice, currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {discountPercent > 0 ? `${discountPercent.toFixed(2)}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.item.lineTotal, currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.deliveryNote.noteType === "export" ? "default" : "secondary"
                            }
                          >
                            {sale.deliveryNote.noteType === "export" ? "Export" : "Local"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

