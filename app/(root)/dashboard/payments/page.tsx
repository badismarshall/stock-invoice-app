import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { FeatureFlagsProvider } from "../_components/feature-flags-provider";
import { SearchParams } from "@/types";
import { searchParamsCache } from "./_lib/validation";
import { getValidFilters } from "@/lib/data-table/data-table";
import { getPayments } from "./_lib/queries";
import { PaymentsTableWrapper } from "./_components/data-table/payments-table-wrapper";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export const metadata: Metadata = {
  title: "Gestion des Paiements",
  description: "Gérez tous les paiements de factures",
};

interface PaymentsPageProps {
  searchParams: Promise<SearchParams>;
}

async function PaymentsPageContent(props: PaymentsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Paiements</h2>
          <p className="text-muted-foreground">
            Gérez tous les paiements de factures ici!
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
        }
      >
        <FeatureFlagsProvider>
          <PaymentsTableWrapper {...props} />
        </FeatureFlagsProvider>
      </Suspense>
    </div>
  );
}

function PaymentsPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Paiements</h2>
          <p className="text-muted-foreground">
            Gérez tous les paiements de factures ici!
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

export default function PaymentsPage(props: PaymentsPageProps) {
  return (
    <Suspense fallback={<PaymentsPageLoading />}>
      <PaymentsPageContent {...props} />
    </Suspense>
  );
}

