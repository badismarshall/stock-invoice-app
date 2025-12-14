import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, DollarSign, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import { getInvoicesQuery } from "../_lib/queries"
import { searchParamsCache } from "../_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"

interface InvoicesOverviewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function InvoicesOverview({ searchParams }: InvoicesOverviewProps) {
  const resolvedSearchParams = await searchParams;
  const search = searchParamsCache.parse(resolvedSearchParams);
  const validFilters = getValidFilters(search.filters);

  const invoicesData = await getInvoicesQuery({
    ...search,
    filters: validFilters,
    perPage: 1, // We only need the summary
  });

  const metrics = [
    {
      title: "Total Factures",
      value: invoicesData.summary.totalInvoices.toLocaleString("fr-FR"),
      description: "Nombre total de factures",
      icon: FileText,
      trend: null,
    },
    {
      title: "Montant Total",
      value: invoicesData.summary.totalAmount.toLocaleString("fr-FR", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      description: "Montant total de toutes les factures",
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Montant Payé",
      value: invoicesData.summary.paidAmount.toLocaleString("fr-FR", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      description: "Montant total des factures payées",
      icon: CheckCircle2,
      trend: "success",
    },
    {
      title: "Montant Impayé",
      value: invoicesData.summary.unpaidAmount.toLocaleString("fr-FR", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      description: "Montant total des factures impayées",
      icon: AlertCircle,
      trend: invoicesData.summary.unpaidAmount > 0 ? "warning" : "success",
    },
    {
      title: "Factures Impayées",
      value: invoicesData.summary.unpaidCount.toLocaleString("fr-FR"),
      description: "Nombre de factures non payées",
      icon: Clock,
      trend: invoicesData.summary.unpaidCount > 0 ? "warning" : "success",
    },
    {
      title: "Factures Échues",
      value: invoicesData.summary.overdueCount.toLocaleString("fr-FR"),
      description: "Factures avec date d'échéance dépassée",
      icon: AlertCircle,
      trend: invoicesData.summary.overdueCount > 0 ? "danger" : "success",
    },
    {
      title: "Montant Partiellement Payé",
      value: invoicesData.summary.partiallyPaidAmount.toLocaleString("fr-FR", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      description: "Montant des factures partiellement payées",
      icon: TrendingUp,
      trend: null,
    },
    {
      title: "Taux de Recouvrement",
      value: invoicesData.summary.totalAmount > 0
        ? `${((invoicesData.summary.paidAmount / invoicesData.summary.totalAmount) * 100).toFixed(1)}%`
        : "0%",
      description: "Pourcentage des factures payées",
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
                  <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    ⚠️ Attention requise
                  </div>
                )}
                {metric.trend === "danger" && (
                  <div className="mt-2 text-xs text-destructive font-medium">
                    🚨 Action urgente
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

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Factures</CardTitle>
          <CardDescription>
            Vue d'ensemble de votre situation de facturation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Factures Payées</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {invoicesData.summary.paidCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {invoicesData.summary.paidAmount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "DZD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Factures Impayées</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {invoicesData.summary.unpaidCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {invoicesData.summary.unpaidAmount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "DZD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Partiellement Payées</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {invoicesData.summary.partiallyPaidCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {invoicesData.summary.partiallyPaidAmount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "DZD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Factures Échues</div>
              <div className="text-2xl font-bold text-destructive">
                {invoicesData.summary.overdueCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Nécessitent une action immédiate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

