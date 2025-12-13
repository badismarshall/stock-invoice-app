import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"
import { CategoryContent } from "./_components/category-content"

export const metadata: Metadata = {
    title: "Catégories",
    description: "Gérez vos catégories de produits",
}

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

async function CategoryPageContent(props: IndexPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={4}
              filterCount={1}
              cellWidths={[
                "10rem",
                "20rem",
                "10rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <CategoryContent {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function CategoryPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <DataTableSkeleton
        columnCount={4}
        filterCount={1}
        cellWidths={[
          "10rem",
          "20rem",
          "10rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function CategoryPage(props: IndexPageProps) {
  return (
    <Suspense fallback={<CategoryPageLoading />}>
      <CategoryPageContent {...props} />
    </Suspense>
  );
}

