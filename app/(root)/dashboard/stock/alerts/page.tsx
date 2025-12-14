import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { StockAlerts } from "../_components/stock-alerts"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Alertes de Stock",
    description: "Produits en rupture de stock",
}

interface StockAlertsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function StockAlertsPageContent(props: StockAlertsPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Alertes de Stock</h2>
            <p className="text-muted-foreground">
              Produits en rupture de stock nécessitant une réapprovisionnement
            </p>
          </div>
          <Link href="/dashboard/stock/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Entrée
            </Button>
          </Link>
        </div>
        <Suspense 
          fallback={
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <DataTableSkeleton key={i} columnCount={1} filterCount={0} />
              ))}
            </div>
          }
        >
          <FeatureFlagsProvider>
            <StockAlerts searchParams={props.searchParams} />
          </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

export default function StockAlertsPage(props: StockAlertsPageProps) {
  return (
    <Suspense fallback={<DataTableSkeleton columnCount={2} filterCount={0} />}>
      <StockAlertsPageContent {...props} />
    </Suspense>
  );
}

