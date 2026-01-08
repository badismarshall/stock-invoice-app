"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocalSalesStats } from "../../_lib/stats-actions";

interface StatsTableProps {
  title: string;
  description: string;
  data: LocalSalesStats["byClient"] | LocalSalesStats["byProduct"];
  type: "client" | "product";
}

export function StatsTable({ title, description, data, type }: StatsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune donnée disponible pour cette période
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {type === "client" ? (
                <>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Nombre de transactions</TableHead>
                  <TableHead className="text-right">Montant total</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Code</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Montant total</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              if (type === "client") {
                const clientItem = item as LocalSalesStats["byClient"][0];
                return (
                  <TableRow key={clientItem.clientId}>
                    <TableCell className="font-medium">{clientItem.clientName}</TableCell>
                    <TableCell className="text-right">{clientItem.transactionCount}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(clientItem.totalAmount)}
                    </TableCell>
                  </TableRow>
                );
              } else {
                const productItem = item as LocalSalesStats["byProduct"][0];
                return (
                  <TableRow key={productItem.productId}>
                    <TableCell className="font-medium">{productItem.productCode}</TableCell>
                    <TableCell>{productItem.productName}</TableCell>
                    <TableCell className="text-right">
                      {productItem.totalQuantity.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(productItem.totalAmount)}
                    </TableCell>
                  </TableRow>
                );
              }
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

