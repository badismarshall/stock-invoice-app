"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  Package,
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
import type { ExportSalesStats } from "../../_lib/stats-actions";

interface StatsCardsProps {
  stats: ExportSalesStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number, currency: string = "DZD") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Chiffre d'Affaires Total",
      value: formatCurrency(stats.summary.totalAmountTTC),
      description: `${stats.summary.totalInvoices} factures`,
      icon: DollarSign,
      trend: stats.summary.growth,
      footer: stats.summary.growth >= 0
        ? `En hausse de ${stats.summary.growth.toFixed(1)}%`
        : `En baisse de ${Math.abs(stats.summary.growth).toFixed(1)}%`,
    },
    {
      title: "Total HT",
      value: formatCurrency(stats.summary.totalAmountHT),
      description: `Hors taxes`,
      icon: FileText,
      trend: null,
      footer: `TVA: ${formatCurrency(stats.summary.totalTaxAmount)}`,
    },
    {
      title: "Bons de Livraison",
      value: stats.summary.totalDeliveryNotes.toString(),
      description: `${stats.summary.totalProformaInvoices} factures proforma`,
      icon: Receipt,
      trend: null,
      footer: "Ventes export",
    },
    {
      title: "Montant Payé",
      value: formatCurrency(stats.summary.paidAmount),
      description: `${formatCurrency(stats.summary.unpaidAmount)} non payé`,
      icon: CreditCard,
      trend: stats.summary.unpaidAmount > 0 ? "warning" : null,
      footer: stats.summary.partiallyPaidAmount > 0
        ? `${formatCurrency(stats.summary.partiallyPaidAmount)} partiellement payé`
        : "Tout est payé",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {card.value}
            </CardTitle>
            {card.trend !== null && (
              <CardAction>
                <Badge
                  variant={
                    card.trend === "warning"
                      ? "destructive"
                      : typeof card.trend === "number" && card.trend >= 0
                      ? "default"
                      : "secondary"
                  }
                >
                  {card.trend === "warning" ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : typeof card.trend === "number" && card.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {typeof card.trend === "number"
                    ? `${card.trend >= 0 ? "+" : ""}${card.trend.toFixed(1)}%`
                    : card.trend}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.description}
            </div>
            <div className="text-muted-foreground">{card.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

