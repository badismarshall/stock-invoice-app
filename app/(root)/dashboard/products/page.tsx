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
import { getProducts } from "./_lib/queries"
import { ProductsTable } from "./_components/data-table/products-table"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export const metadata: Metadata = {
    title: "Produits",
    description: "Une liste de tous les produits.",
}

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

async function ProductsPageContent(props: IndexPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Produits</h2>
            <p className="text-muted-foreground">
              Gérez tous vos produits ici!
            </p>
          </div>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>
          </Link>
        </div>
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={9}
              filterCount={2}
              cellWidths={[
                "10rem",
                "20rem",
                "15rem",
                "10rem",
                "10rem",
                "10rem",
                "10rem",
                "6rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <ProductsTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function ProductsPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produits</h2>
          <p className="text-muted-foreground">
            Gérez tous vos produits ici!
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={9}
        filterCount={2}
        cellWidths={[
          "10rem",
          "20rem",
          "15rem",
          "10rem",
          "10rem",
          "10rem",
          "10rem",
          "6rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function ProductsPage(props: IndexPageProps) {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent {...props} />
    </Suspense>
  );
}  

async function ProductsTableWrapper(props: IndexPageProps ) {
    
    const searchParams = await props.searchParams;
    const search = searchParamsCache.parse(searchParams);
  
    const validFilters = getValidFilters(search.filters);
  
    const promises = getProducts({
      ...search,
      filters: validFilters,
    });

    return <ProductsTable promises={promises}/>
}

