 import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/app/(root)/dashboard/_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getExportInvoices } from "./_lib/queries"
import { ExportInvoicesTableWrapper } from "./_components/data-table/export-invoices-table-wrapper"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Factures Export",
    description: "Gestion des factures export",
}

interface ExportInvoicesPageProps {
  searchParams: Promise<SearchParams>;
}

async function ExportInvoicesPageContent(props: ExportInvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Factures Export</h2>
            <p className="text-muted-foreground">
              Gérez toutes vos factures export ici!
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
                <ExportInvoicesTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function ExportInvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Factures Export</h2>
          <p className="text-muted-foreground">
            Gérez toutes vos factures export ici!
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

export default function ExportInvoicesPage(props: ExportInvoicesPageProps) {
  return (
    <Suspense fallback={<ExportInvoicesPageLoading />}>
      <ExportInvoicesPageContent {...props} />
    </Suspense>
  );
}

