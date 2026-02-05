import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { SearchParams } from "@/types";
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider";
import { SalesCustomerPaymentsTableWrapper } from "./_components/data-table/sales-customer-payments-table-wrapper";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export const metadata: Metadata = {
  title: "Chiffre d'affaire et règlement clients",
  description: "Gestion du chiffre d'affaire et des règlements clients",
};

interface SalesCustomerPaymentsPageProps {
  searchParams: Promise<SearchParams>;
}

async function SalesCustomerPaymentsPageContent(props: SalesCustomerPaymentsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chiffre d'affaire et règlement clients</h2>
          <p className="text-muted-foreground">
            Consultez le chiffre d'affaire et les règlements clients par période et client
          </p>
        </div>
      </div>
      <Suspense 
        fallback={    
          <DataTableSkeleton
            columnCount={7}
            filterCount={2}
            cellWidths={[
              "10rem",
              "15rem",
              "12rem",
              "12rem",
              "12rem",
              "12rem",
              "12rem",
            ]}
            shrinkZero
          />
        }>
        <FeatureFlagsProvider>
          <SalesCustomerPaymentsTableWrapper {...props} />
        </FeatureFlagsProvider>
      </Suspense>
    </div>
  );
}

function SalesCustomerPaymentsPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chiffre d'affaire et règlement clients</h2>
          <p className="text-muted-foreground">
            Consultez le chiffre d'affaire et les règlements clients par période et client
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={7}
        filterCount={2}
        cellWidths={[
          "10rem",
          "15rem",
          "12rem",
          "12rem",
          "12rem",
          "12rem",
          "12rem",
        ]}
        shrinkZero
      />
    </div>
  );
}

export default function SalesCustomerPaymentsPage(props: SalesCustomerPaymentsPageProps) {
  return (
    <Suspense fallback={<SalesCustomerPaymentsPageLoading />}>
      <SalesCustomerPaymentsPageContent {...props} />
    </Suspense>
  );
}

