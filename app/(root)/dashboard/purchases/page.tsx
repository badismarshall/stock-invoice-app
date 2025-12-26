import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getPurchaseOrders } from "./_lib/queries"
import { PurchaseOrdersTable } from "./_components/data-table/purchase-orders-table"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"
import { PurchasesPageButtons } from "./_components/purchases-page-buttons"

export const metadata: Metadata = {
    title: "Achats",
    description: "Une liste de tous les bons de commande.",
}

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

async function PurchasesPageContent(props: IndexPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Achats</h2>
            <p className="text-muted-foreground">
              Gérez tous vos bons de commande ici!
            </p>
          </div>
          <PurchasesPageButtons />
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
                "10rem",
                "12rem",
                "12rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <PurchaseOrdersTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function PurchasesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Achats</h2>
          <p className="text-muted-foreground">
            Gérez tous vos bons de commande ici!
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
          "10rem",
          "12rem",
          "12rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function PurchasesPage(props: IndexPageProps) {
  return (
    <Suspense fallback={<PurchasesPageLoading />}>
      <PurchasesPageContent {...props} />
    </Suspense>
  );
}  

async function PurchaseOrdersTableWrapper(props: IndexPageProps ) {
    
    const searchParams = await props.searchParams;
    const search = searchParamsCache.parse(searchParams);
  
    const validFilters = getValidFilters(search.filters);
  
    const promises = getPurchaseOrders({
      ...search,
      filters: validFilters,
    });

    return <PurchaseOrdersTable promises={promises}/>
}

