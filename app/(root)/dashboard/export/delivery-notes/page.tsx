import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getDeliveryNotes } from "./_lib/queries"
import { DeliveryNotesTableWrapper } from "./_components/data-table/delivery-notes-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Bons de Livraison Export",
    description: "Liste de tous les bons de livraison pour les ventes export",
}

interface DeliveryNotesPageProps {
  searchParams: Promise<SearchParams>;
}

async function DeliveryNotesPageContent(props: DeliveryNotesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bons de Livraison Export</h2>
            <p className="text-muted-foreground">
              Gérez tous vos bons de livraison pour les ventes export
            </p>
          </div>
          <Link href="/dashboard/export/delivery-note/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Bon de Livraison
            </Button>
          </Link>
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

function DeliveryNotesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bons de Livraison Export</h2>
          <p className="text-muted-foreground">
            Gérez tous vos bons de livraison pour les ventes export
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

export default function DeliveryNotesPage(props: DeliveryNotesPageProps) {
  return (
    <Suspense fallback={<DeliveryNotesPageLoading />}>
      <DeliveryNotesPageContent {...props} />
    </Suspense>
  );
}

