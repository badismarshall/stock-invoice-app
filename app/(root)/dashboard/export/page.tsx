import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getDeliveryNotes } from "./_lib/queries"
import { DeliveryNotesTableWrapper } from "./_components/data-table/delivery-notes-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Ventes Export",
    description: "Gestion des factures proforma, bons de livraison et factures pour les ventes export",
}

interface ExportPageProps {
  searchParams: Promise<SearchParams>;
}

async function ExportPageContent(props: ExportPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ventes Export</h2>
            <p className="text-muted-foreground">
              Gérez vos factures proforma, bons de livraison et factures pour les ventes export
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/export/proforma/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Facture Proforma
              </Button>
            </Link>
            <Link href="/dashboard/export/delivery-note/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Bon de Livraison
              </Button>
            </Link>
            <Link href="/dashboard/export/invoice/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Facture Export
              </Button>
            </Link>
          </div>
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

function ExportPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ventes Export</h2>
          <p className="text-muted-foreground">
            Gérez vos factures proforma, bons de livraison et factures pour les ventes export
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

export default function ExportPage(props: ExportPageProps) {
  return (
    <Suspense fallback={<ExportPageLoading />}>
      <ExportPageContent {...props} />
    </Suspense>
  );
}

