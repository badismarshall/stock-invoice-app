import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";
import { RolesTable } from "./_components/data-table/roles-table";
import { RolesPrimaryButtons } from "./_components/roles-primary-buttons";
import { getRolesQuery } from "./_lib/queries";
import type { SearchParams } from "@/types";

export const metadata: Metadata = {
  title: "Rôles & Permissions",
  description: "Gérer les rôles et permissions des utilisateurs",
};

interface RolesPageProps {
  searchParams: Promise<SearchParams>;
}

async function RolesPageContent(props: RolesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rôles & Permissions</h2>
          <p className="text-muted-foreground">
            Gérez les rôles et les permissions des utilisateurs
          </p>
        </div>
        <RolesPrimaryButtons />
      </div>
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={5}
            filterCount={0}
            cellWidths={["10rem", "20rem", "10rem", "10rem", "6rem"]}
            shrinkZero
          />
        }
      >
        <RolesTableWrapper {...props} />
      </Suspense>
    </div>
  );
}

function RolesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rôles & Permissions</h2>
          <p className="text-muted-foreground">
            Gérez les rôles et les permissions des utilisateurs
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={5}
        filterCount={0}
        cellWidths={["10rem", "20rem", "10rem", "10rem", "6rem"]}
        shrinkZero
      />
    </div>
  );
}

export default function RolesPage(props: RolesPageProps) {
  return (
    <Suspense fallback={<RolesPageLoading />}>
      <RolesPageContent {...props} />
    </Suspense>
  );
}

async function RolesTableWrapper(props: RolesPageProps) {
  const searchParams = await props.searchParams;
  const promises = getRolesQuery(searchParams);

  return <RolesTable promises={promises} />;
}

