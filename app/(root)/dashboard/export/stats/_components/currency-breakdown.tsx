"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExportSalesStats } from "../../_lib/stats-actions";

interface CurrencyBreakdownProps {
  data: ExportSalesStats["byCurrency"];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function CurrencyBreakdown({ data }: CurrencyBreakdownProps) {
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = data.map((item) => ({
    name: item.currency,
    value: item.totalAmount,
    count: item.transactionCount,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Devise</CardTitle>
          <CardDescription>Répartition du chiffre d'affaires par devise</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par Devise</CardTitle>
        <CardDescription>Répartition du chiffre d'affaires par devise</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                const currency = props.payload.name;
                return formatCurrency(value, currency);
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.currency} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.currency}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(item.totalAmount, item.currency)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {item.transactionCount} transaction{item.transactionCount > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

