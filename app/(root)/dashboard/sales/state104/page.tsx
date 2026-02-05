import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { SearchParams } from "@/types";
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider";
import { State104TableWrapper } from "./_components/data-table/state104-table-wrapper";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export const metadata: Metadata = {
  title: "Etat 104",
  description: "Etat 104 - Totale TVA par client",
};

interface State104PageProps {
  searchParams: Promise<SearchParams>;
}

async function State104PageContent(props: State104PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Etat 104</h2>
          <p className="text-muted-foreground">
            Totale TVA par client sur la période et les clients sélectionnés
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={7}
            filterCount={2}
            cellWidths={["3rem", "15rem", "15rem", "12rem", "12rem", "12rem", "12rem"]}
            shrinkZero
          />
        }
      >
        <FeatureFlagsProvider>
          <State104TableWrapper {...props} />
        </FeatureFlagsProvider>
      </Suspense>
    </div>
  );
}

function State104PageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Etat 104</h2>
          <p className="text-muted-foreground">
            Totale TVA par client sur la période et les clients sélectionnés
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={7}
        filterCount={2}
        cellWidths={["3rem", "15rem", "15rem", "12rem", "12rem", "12rem", "12rem"]}
        shrinkZero
      />
    </div>
  );
}

export default function State104Page(props: State104PageProps) {
  return (
    <Suspense fallback={<State104PageLoading />}>
      <State104PageContent {...props} />
    </Suspense>
  );
}
