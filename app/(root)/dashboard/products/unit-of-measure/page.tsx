import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"
import { UnitOfMeasureContent } from "./_components/unit-of-measure-content"

export const metadata: Metadata = {
    title: "Unités de mesure",
    description: "Gérez vos unités de mesure",
}

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

async function UnitOfMeasurePageContent(props: IndexPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={5}
              filterCount={2}
              cellWidths={[
                "10rem",
                "15rem",
                "10rem",
                "20rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <UnitOfMeasureContent {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function UnitOfMeasurePageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <DataTableSkeleton
        columnCount={5}
        filterCount={2}
        cellWidths={[
          "10rem",
          "15rem",
          "10rem",
          "20rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function UnitOfMeasurePage(props: IndexPageProps) {
  return (
    <Suspense fallback={<UnitOfMeasurePageLoading />}>
      <UnitOfMeasurePageContent {...props} />
    </Suspense>
  );
}

