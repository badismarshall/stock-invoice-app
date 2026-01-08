import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { InvoicesTableWrapper } from "../_components/data-table/invoices-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Factures de vente export",
    description: "Gestion des factures de vente export",
}

interface InvoicesPageProps {
  searchParams: Promise<SearchParams>;
}

async function InvoicesPageContent(props: InvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Factures de vente export</h2>
            <p className="text-muted-foreground">
              Gérez toutes vos factures de vente export ici!
            </p>
          </div>
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Facture
            </Button>
          </Link>
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
                <InvoicesTableWrapper {...props} invoiceTypeFilter={["sale_export"]} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function InvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Factures de vente export</h2>
          <p className="text-muted-foreground">
            Gérez toutes vos factures de vente export ici!
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

export default function InvoicesPage(props: InvoicesPageProps) {
  return (
    <Suspense fallback={<InvoicesPageLoading />}>
      <InvoicesPageContent {...props} />
    </Suspense>
  );
}

