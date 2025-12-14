import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { StockOverview } from "../_components/stock-overview"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Vue d'ensemble - Stock",
    description: "Vue d'ensemble du stock",
}

interface StockOverviewPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function StockOverviewPageContent(props: StockOverviewPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble du Stock</h2>
            <p className="text-muted-foreground">
              Statistiques et résumé de votre stock
            </p>
          </div>
        </div>
        <Suspense 
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <DataTableSkeleton key={i} columnCount={1} filterCount={0} />
              ))}
            </div>
          }
        >
            <StockOverview searchParams={props.searchParams} />

        </Suspense>
      </div>
    )
}

export default function StockOverviewPage(props: StockOverviewPageProps) {
  return (
    <Suspense fallback={<DataTableSkeleton columnCount={4} filterCount={0} />}>
      <StockOverviewPageContent {...props} />
    </Suspense>
  );
}

