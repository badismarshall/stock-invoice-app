import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react"
import { getStockCurrentQuery } from "../_lib/queries"
import { searchParamsCache } from "../_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"

interface StockOverviewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function StockOverview({ searchParams }: StockOverviewProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  const validFilters = getValidFilters(search.filters);

  const stockDataResult = await getStockCurrentQuery({
    ...search,
    filters: validFilters,
    perPage: 1, // We only need the summary
  });
  
  const stockData = {
    stock: stockDataResult.data,
    summary: stockDataResult.summary,
  };

  const metrics = [
    {
      title: "Valeur Totale du Stock",
      value: stockData.summary.totalStockValue.toLocaleString("fr-FR", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      description: "Valeur totale du stock en magasin",
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Nombre de Produits",
      value: stockData.summary.totalProducts.toLocaleString("fr-FR"),
      description: "Total des produits en stock",
      icon: Package,
      trend: null,
    },
    {
      title: "Produits en Rupture",
      value: stockData.summary.lowStockCount.toLocaleString("fr-FR"),
      description: "Produits avec stock ≤ 0",
      icon: AlertTriangle,
      trend: stockData.summary.lowStockCount > 0 ? "warning" : "success",
    },
    {
      title: "Valeur Moyenne",
      value: stockData.summary.totalProducts > 0
        ? (stockData.summary.totalStockValue / stockData.summary.totalProducts).toLocaleString("fr-FR", {
            style: "currency",
            currency: "DZD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        : "0 DZD",
      description: "Valeur moyenne par produit",
      icon: TrendingUp,
      trend: null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
                {metric.trend === "warning" && (
                  <div className="mt-2 text-xs text-destructive font-medium">
                    ⚠️ Attention requise
                  </div>
                )}
                {metric.trend === "success" && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Tout est bon
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé du Stock</CardTitle>
          <CardDescription>
            Vue d'ensemble rapide de votre stock actuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valeur totale du stock</span>
              <span className="text-lg font-semibold">
                {stockData.summary.totalStockValue.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "DZD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nombre total de produits</span>
              <span className="text-lg font-semibold">
                {stockData.summary.totalProducts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Produits en rupture de stock</span>
              <span className={`text-lg font-semibold ${stockData.summary.lowStockCount > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                {stockData.summary.lowStockCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valeur moyenne par produit</span>
              <span className="text-lg font-semibold">
                {stockData.summary.totalProducts > 0
                  ? (stockData.summary.totalStockValue / stockData.summary.totalProducts).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "DZD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })
                  : "0 DZD"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

