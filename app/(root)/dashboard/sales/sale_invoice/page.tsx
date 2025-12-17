import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getSaleInvoices } from "./_lib/queries"
import { SaleInvoicesTableWrapper } from "./_components/data-table/sale-invoices-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Factures de Vente",
    description: "Gestion des factures de vente",
}

interface SaleInvoicesPageProps {
  searchParams: Promise<SearchParams>;
}

async function SaleInvoicesPageContent(props: SaleInvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Factures de Vente</h2>
            <p className="text-muted-foreground">
              Gérez toutes vos factures de vente ici!
            </p>
          </div>
        </div>
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={10}
              filterCount={2}
              cellWidths={[
                "10rem",
                "15rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "12rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <SaleInvoicesTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function SaleInvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Factures de Vente</h2>
          <p className="text-muted-foreground">
            Gérez toutes vos factures de vente ici!
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={10}
        filterCount={2}
        cellWidths={[
          "10rem",
          "15rem",
          "12rem",
          "12rem",
          "12rem",
          "12rem",
          "12rem",
          "12rem",
          "12rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function SaleInvoicesPage(props: SaleInvoicesPageProps) {
  return (
    <Suspense fallback={<SaleInvoicesPageLoading />}>
      <SaleInvoicesPageContent {...props} />
    </Suspense>
  );
}

