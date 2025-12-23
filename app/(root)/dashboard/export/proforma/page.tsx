import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/app/(root)/dashboard/_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getProformaInvoices } from "./_lib/queries"
import { ProformaInvoicesTableWrapper } from "./_components/data-table/proforma-invoices-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Factures Proforma",
    description: "Gestion des factures proforma",
}

interface ProformaInvoicesPageProps {
  searchParams: Promise<SearchParams>;
}

async function ProformaInvoicesPageContent(props: ProformaInvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Factures Proforma</h2>
            <p className="text-muted-foreground">
              Gérez toutes vos factures proforma ici!
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
                <ProformaInvoicesTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function ProformaInvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Factures Proforma</h2>
          <p className="text-muted-foreground">
            Gérez toutes vos factures proforma ici!
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

export default function ProformaInvoicesPage(props: ProformaInvoicesPageProps) {
  return (
    <Suspense fallback={<ProformaInvoicesPageLoading />}>
      <ProformaInvoicesPageContent {...props} />
    </Suspense>
  );
}

