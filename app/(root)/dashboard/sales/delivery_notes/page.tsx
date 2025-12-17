import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getDeliveryNotesInvoices } from "./_lib/queries"
import { DeliveryNotesInvoicesTableWrapper } from "./_components/data-table/delivery-notes-invoices-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Bons de Livraison",
    description: "Gestion des bons de livraison",
}

interface DeliveryNotesInvoicesPageProps {
  searchParams: Promise<SearchParams>;
}

async function DeliveryNotesInvoicesPageContent(props: DeliveryNotesInvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bons de Livraison</h2>
            <p className="text-muted-foreground">
              Gérez tous vos bons de livraison ici!
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
                <DeliveryNotesInvoicesTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function DeliveryNotesInvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bons de Livraison</h2>
          <p className="text-muted-foreground">
            Gérez tous vos bons de livraison ici!
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

export default function DeliveryNotesInvoicesPage(props: DeliveryNotesInvoicesPageProps) {
  return (
    <Suspense fallback={<DeliveryNotesInvoicesPageLoading />}>
      <DeliveryNotesInvoicesPageContent {...props} />
    </Suspense>
  );
}

