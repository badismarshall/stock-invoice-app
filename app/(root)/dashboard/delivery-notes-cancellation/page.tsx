import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { DeliveryNoteCancellationsTableWrapper } from "./_components/data-table/delivery-note-cancellations-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Annulations de Bons de Livraison",
    description: "Liste des annulations de bons de livraison",
}

interface DeliveryNoteCancellationsPageProps {
  searchParams: Promise<SearchParams>;
}

async function DeliveryNoteCancellationsPageContent(props: DeliveryNoteCancellationsPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Annulations de Bons de Livraison</h2>
            <p className="text-muted-foreground">
              Liste de toutes les annulations de bons de livraison
            </p>
          </div>
          <Link href="/dashboard/delivery-notes-cancellation/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Annulation
            </Button>
          </Link>
        </div>
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={6}
              filterCount={2}
              cellWidths={[
                "10rem",
                "15rem",
                "12rem",
                "20rem",
                "12rem",
                "12rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <DeliveryNoteCancellationsTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function DeliveryNoteCancellationsPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Annulations de Bons de Livraison</h2>
          <p className="text-muted-foreground">
            Liste de toutes les annulations de bons de livraison
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={6}
        filterCount={2}
        cellWidths={[
          "10rem",
          "15rem",
          "12rem",
          "20rem",
          "12rem",
          "12rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function DeliveryNoteCancellationsPage(props: DeliveryNoteCancellationsPageProps) {
  return (
    <Suspense fallback={<DeliveryNoteCancellationsPageLoading />}>
      <DeliveryNoteCancellationsPageContent {...props} />
    </Suspense>
  );
}

