import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"
import { ClientsContent } from "./_components/clients-content"

export const metadata: Metadata = {
    title: "Clients",
    description: "Gérez vos clients",
}

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

async function ClientsPageContent(props: IndexPageProps) {
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
                "20rem",
                "20rem",
                "10rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <ClientsContent {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function ClientsPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <DataTableSkeleton
        columnCount={5}
        filterCount={2}
        cellWidths={[
          "10rem",
          "20rem",
          "20rem",
          "10rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function ClientsPage(props: IndexPageProps) {
  return (
    <Suspense fallback={<ClientsPageLoading />}>
      <ClientsPageContent {...props} />
    </Suspense>
  );
}

