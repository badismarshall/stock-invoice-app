"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocalSalesStats } from "../../_lib/stats-actions";

interface StatsChartProps {
  data: LocalSalesStats["byPeriod"];
}

export function StatsChart({ data }: StatsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = data.map((item) => ({
    period: item.period,
    montant: item.totalAmount,
    transactions: item.transactionCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
        <CardDescription>Évolution mensuelle des ventes locales</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${month}/${year.slice(2)}`;
              }}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Période: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="montant"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Montant (DZD)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

