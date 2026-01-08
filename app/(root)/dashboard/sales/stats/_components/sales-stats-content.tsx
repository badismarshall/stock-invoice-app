"use client";

import * as React from "react";
import { getLocalSalesStats, type LocalSalesStats } from "../../_lib/stats-actions";
import { StatsCards } from "./stats-cards";
import { StatsFilters } from "./stats-filters";
import { StatsChart } from "./stats-chart";
import { StatsTable } from "./stats-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { startOfYear, endOfDay } from "date-fns";

export function SalesStatsContent() {
  const [stats, setStats] = React.useState<LocalSalesStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Normalize initial dates
  const initialStartDate = React.useMemo(() => {
    const date = startOfYear(new Date());
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  const initialEndDate = React.useMemo(() => {
    const date = endOfDay(new Date());
    return date;
  }, []);
  
  const [startDate, setStartDate] = React.useState<Date | undefined>(initialStartDate);
  const [endDate, setEndDate] = React.useState<Date | undefined>(initialEndDate);

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getLocalSalesStats({
          startDate,
          endDate,
        });
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setStats(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">État de Vente Local</h2>
          <p className="text-muted-foreground">
            Statistiques détaillées des ventes locales
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">État de Vente Local</h2>
          <p className="text-muted-foreground">
            Statistiques détaillées des ventes locales
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Aucune donnée disponible</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">État de Vente Local</h2>
        <p className="text-muted-foreground">
          Statistiques détaillées des ventes locales
        </p>
      </div>

      <StatsFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <StatsCards stats={stats} />

      {stats.byPeriod.length > 0 && (
        <StatsChart data={stats.byPeriod} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsTable
          title="Top Clients"
          description="Clients avec le plus grand chiffre d'affaires"
          data={stats.byClient}
          type="client"
        />
        <StatsTable
          title="Top Produits"
          description="Produits les plus vendus"
          data={stats.byProduct}
          type="product"
        />
      </div>
    </div>
  );
}

