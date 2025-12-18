"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  FileText,
  Package,
  AlertTriangle,
  Users,
  CreditCard,
  Receipt
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface DashboardStats {
  sales: {
    totalAmount: number;
    count: number;
    paidAmount: number;
    unpaidAmount: number;
    growth: number;
  };
  purchases: {
    totalAmount: number;
    count: number;
    paidAmount: number;
    unpaidAmount: number;
  };
  unpaidInvoices: {
    count: number;
    totalAmount: number;
  };
  partiallyPaidInvoices: {
    count: number;
    totalAmount: number;
  };
  payments: {
    totalAmount: number;
    count: number;
  };
  stock: {
    totalValue: number;
    totalProducts: number;
    lowStockCount: number;
  };
  products: {
    total: number;
  };
  partners: {
    clients: number;
    suppliers: number;
  };
}

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Chiffre d'Affaires",
      value: formatCurrency(stats.sales.totalAmount),
      description: `${stats.sales.count} factures de vente ce mois`,
      icon: DollarSign,
      trend: stats.sales.growth,
      link: "/dashboard/sales/sale_invoice",
      footer: stats.sales.growth >= 0
        ? `En hausse de ${stats.sales.growth.toFixed(1)}% ce mois`
        : `En baisse de ${Math.abs(stats.sales.growth).toFixed(1)}% ce mois`,
    },
    {
      title: "Achats",
      value: formatCurrency(stats.purchases.totalAmount),
      description: `${stats.purchases.count} factures d'achat ce mois`,
      icon: ShoppingCart,
      trend: null,
      link: "/dashboard/purchases/purchase_invoice",
      footer: `${formatCurrency(stats.purchases.unpaidAmount)} non payés`,
    },
    {
      title: "Factures Impayées",
      value: stats.unpaidInvoices.count.toString(),
      description: formatCurrency(stats.unpaidInvoices.totalAmount),
      icon: FileText,
      trend: stats.unpaidInvoices.count > 0 ? "warning" : null,
      link: "/dashboard/invoices?paymentStatus=unpaid",
      footer: "Nécessitent une attention",
    },
    {
      title: "Paiements Partiels",
      value: stats.partiallyPaidInvoices.count.toString(),
      description: formatCurrency(stats.partiallyPaidInvoices.totalAmount),
      icon: CreditCard,
      trend: stats.partiallyPaidInvoices.count > 0 ? "warning" : null,
      link: "/dashboard/invoices?paymentStatus=partially_paid",
      footer: "En attente de paiement",
    },
    {
      title: "Valeur du Stock",
      value: formatCurrency(stats.stock.totalValue),
      description: `${stats.stock.totalProducts} produits en stock`,
      icon: Package,
      trend: null,
      link: "/dashboard/stock",
      footer: stats.stock.lowStockCount > 0
        ? `${stats.stock.lowStockCount} produits en rupture`
        : "Stock optimal",
    },
    {
      title: "Paiements Reçus",
      value: formatCurrency(stats.payments.totalAmount),
      description: `${stats.payments.count} paiements ce mois`,
      icon: Receipt,
      trend: null,
      link: "/dashboard/payments",
      footer: "Ce mois",
    },
    {
      title: "Produits Actifs",
      value: stats.products.total.toString(),
      description: "Produits disponibles",
      icon: Package,
      trend: null,
      link: "/dashboard/products",
      footer: "Enregistrés dans le système",
    },
    {
      title: "Clients & Fournisseurs",
      value: `${stats.partners.clients + stats.partners.suppliers}`,
      description: `${stats.partners.clients} clients, ${stats.partners.suppliers} fournisseurs`,
      icon: Users,
      trend: null,
      link: "/dashboard/clients-suppliers",
      footer: "Partenaires enregistrés",
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, index) => (
        <Link key={index} href={card.link} className="block">
          <Card className="@container/card hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              {card.trend !== null && (
                <CardAction>
                  <Badge variant={card.trend === "warning" ? "destructive" : (typeof card.trend === 'number' && card.trend >= 0) ? "default" : "secondary"}>
                    {card.trend === "warning" ? (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    ) : (typeof card.trend === 'number' && card.trend >= 0) ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {typeof card.trend === "number"
                      ? `${card.trend >= 0 ? '+' : ''}${card.trend.toFixed(1)}%`
                      : card.trend
                    }
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.description}
              </div>
              <div className="text-muted-foreground">
                {card.footer}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

