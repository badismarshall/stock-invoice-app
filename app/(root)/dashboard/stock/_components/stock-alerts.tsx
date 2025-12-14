import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Package } from "lucide-react"
import { getStockCurrentQuery } from "../_lib/queries"
import { searchParamsCache } from "../_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/data-table/format"

interface StockAlertsProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function StockAlerts({ searchParams }: StockAlertsProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  const validFilters = getValidFilters(search.filters);

  // Get only low stock items (quantity <= 0)
  const stockDataResult = await getStockCurrentQuery({
    ...search,
    filters: validFilters,
    lowStock: [true],
    perPage: 100, // Get more items for alerts
  });

  const stockData = {
    stock: stockDataResult.data,
    summary: stockDataResult.summary,
  };

  const lowStockItems = stockData.stock.filter(item => item.quantityAvailable <= 0);
  const criticalItems = stockData.stock.filter(item => item.quantityAvailable < 0); // Negative stock (shouldn't happen but could)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produits en Rupture
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produits avec stock ≤ 0
            </p>
          </CardContent>
        </Card>

        {criticalItems.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stock Négatif
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {criticalItems.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Produits avec stock négatif (erreur)
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Low Stock Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Produits en Rupture</CardTitle>
          <CardDescription>
            Produits nécessitant une réapprovisionnement urgent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun produit en rupture</p>
              <p className="text-sm">Tous vos produits sont en stock</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Code</th>
                      <th className="px-4 py-3 text-left font-medium">Produit</th>
                      <th className="px-4 py-3 text-left font-medium">Catégorie</th>
                      <th className="px-4 py-3 text-right font-medium">Stock</th>
                      <th className="px-4 py-3 text-right font-medium">Coût Moyen</th>
                      <th className="px-4 py-3 text-left font-medium">Dernier Mouvement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lowStockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">
                          {item.productCode || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {item.productName || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.categoryName || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="destructive">
                            {item.quantityAvailable.toLocaleString("fr-FR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 3,
                            })}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.averageCost.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "DZD",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.lastMovementDate ? formatDate(item.lastMovementDate) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

