import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { StockMovementsTableWrapper } from "../_components/data-table/stock-movements-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Mouvements de Stock",
    description: "Historique de tous les mouvements de stock",
}

interface StockMovementsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function StockMovementsPageContent(props: StockMovementsPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mouvements de Stock</h2>
            <p className="text-muted-foreground">
              Historique de tous les mouvements d'entrée et de sortie de stock
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
            <DataTableSkeleton
              columnCount={12}
              filterCount={2}
              cellWidths={[
                "10rem",
                "15rem",
                "10rem",
                "10rem",
                "10rem",
                "10rem",
                "10rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "6rem",
              ]}
              shrinkZero
            />
          }
        >
          <FeatureFlagsProvider>
            <StockMovementsTableWrapper searchParams={props.searchParams} />
          </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

export default function StockMovementsPage(props: StockMovementsPageProps) {
  return (
    <Suspense fallback={<DataTableSkeleton columnCount={12} filterCount={2} />}>
      <StockMovementsPageContent {...props} />
    </Suspense>
  );
}

