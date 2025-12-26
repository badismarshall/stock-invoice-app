import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getDeliveryNotes } from "./_lib/queries"
import { DeliveryNotesTableWrapper } from "./_components/data-table/delivery-notes-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"
import { SalesPageButtons } from "./_components/sales-page-buttons"

export const metadata: Metadata = {
    title: "Ventes Locales",
    description: "Gestion des bons de livraison et factures pour les ventes locales",
}

interface SalesPageProps {
  searchParams: Promise<SearchParams>;
}

async function SalesPageContent(props: SalesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ventes Locales</h2>
            <p className="text-muted-foreground">
              Gérez vos bons de livraison et factures pour les ventes locales
            </p>
          </div>
          <SalesPageButtons />
        </div>
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={8}
              filterCount={2}
              cellWidths={[
                "10rem",
                "15rem",
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
                <DeliveryNotesTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function SalesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ventes Locales</h2>
          <p className="text-muted-foreground">
            Gérez vos bons de livraison et factures pour les ventes locales
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={8}
        filterCount={2}
        cellWidths={[
          "10rem",
          "15rem",
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

export default function SalesPage(props: SalesPageProps) {
  return (
    <Suspense fallback={<SalesPageLoading />}>
      <SalesPageContent {...props} />
    </Suspense>
  );
}


