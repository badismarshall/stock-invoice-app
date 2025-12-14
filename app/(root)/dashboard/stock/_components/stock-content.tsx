import { Suspense } from "react"
import { StockOverview } from "./stock-overview"
import { StockCurrentTableWrapper } from "./data-table/stock-current-table-wrapper"
import { StockMovementsTableWrapper } from "./data-table/stock-movements-table-wrapper"
import { StockAlerts } from "./stock-alerts"
import { StockTabs } from "./stock-tabs"

interface StockContentProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function StockContent({ searchParams }: StockContentProps) {
  return (
    <StockTabs
      overviewContent={
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <StockOverview searchParams={searchParams} />
        </Suspense>
      }
      stockContent={
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <StockCurrentTableWrapper searchParams={searchParams} />
        </Suspense>
      }
      movementsContent={
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <StockMovementsTableWrapper searchParams={searchParams} />
        </Suspense>
      }
      alertsContent={
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <StockAlerts searchParams={searchParams} />
        </Suspense>
      }
    />
  )
}

