import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { UsersPrimaryButtons } from "./_components/users-primary-buttons"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { SearchParams } from "@/types"
import { searchParamsCache } from "./_lib/validation"
import { getValidFilters } from "@/lib/data-table/data-table"
import { getUserBannedCounts, getUserEmailVerifiedCounts, getUserRoleCounts, getUsers } from "./_lib/queries"
import { getRoles } from "@/app/(root)/dashboard/roles/_lib/actions"
import { UsersTable } from "./_components/data-table/users-table"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"
import { HasPermissionUser } from "@/data/user/user-permision"

export const metadata: Metadata = {
    title: "Utilisateurs",
    description: "Une liste de toutes les utilisateurs.",
}

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

async function UsersPageContent(props: IndexPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }
    
    // const hasAccesslistuser = await HasPermissionUser(["list"]);
    // if (!hasAccesslistuser.success) return redirect("/dashboard/")

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Content de te revoir!</h2>
            <p className="text-muted-foreground">
              Voici une liste de toutes les utilisateurs!
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <Suspense 
            fallback={    
              <DataTableSkeleton
              columnCount={7}
              filterCount={2}
              cellWidths={[
                "10rem",
                "30rem",
                "10rem",
                "10rem",
                "6rem",
                "6rem",
                "6rem",
              ]}
              shrinkZero
            />
            }>
              <FeatureFlagsProvider>
                <UsersTableWrapper {...props} />
              </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

function UsersPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content de te revoir!</h2>
          <p className="text-muted-foreground">
            Voici une liste de toutes les utilisateurs!
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={7}
        filterCount={2}
        cellWidths={[
          "10rem",
          "30rem",
          "10rem",
          "10rem",
          "6rem",
          "6rem",
          "6rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function UsersPage(props: IndexPageProps) {
  return (
    <Suspense fallback={<UsersPageLoading />}>
      <UsersPageContent {...props} />
    </Suspense>
  );
}  


async function UsersTableWrapper(props: IndexPageProps ) {
    
    const searchParams = await props.searchParams;
    const search = searchParamsCache.parse(searchParams);
  
    const validFilters = getValidFilters(search.filters);
  
    const promises = Promise.all([
      getUsers({
        ...search,
        filters: validFilters,
      }),
      getUserRoleCounts(),
      getUserBannedCounts(),
      getUserEmailVerifiedCounts(),
      getRoles(),
    ]);

    return <UsersTable promises={promises}/>
}
