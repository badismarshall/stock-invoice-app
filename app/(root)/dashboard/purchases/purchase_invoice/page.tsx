import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getPurchaseInvoices } from "./_lib/queries"
import { PurchaseInvoicesTableWrapper } from "./_components/data-table/purchase-invoices-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Factures d'Achat",
    description: "Gestion des factures d'achat",
}

interface PurchaseInvoicesPageProps {
  searchParams: Promise<SearchParams>;
}

async function PurchaseInvoicesPageContent(props: PurchaseInvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Factures d'Achat</h2>
            <p className="text-muted-foreground">
              Gérez toutes vos factures d'achat ici!
            </p>
          </div>
        </div>
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={9}
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
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <PurchaseInvoicesTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function PurchaseInvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Factures d'Achat</h2>
          <p className="text-muted-foreground">
            Gérez toutes vos factures d'achat ici!
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={9}
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
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function PurchaseInvoicesPage(props: PurchaseInvoicesPageProps) {
  return (
    <Suspense fallback={<PurchaseInvoicesPageLoading />}>
      <PurchaseInvoicesPageContent {...props} />
    </Suspense>
  );
}

