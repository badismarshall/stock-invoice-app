import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider";
import { SearchParams } from "@/types";
import { SalesCustomerPaymentsTableWrapper } from "./_components/data-table/sales-customer-payments-table-wrapper";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export const metadata: Metadata = {
  title: "Chiffre d'affaire et Règlement Clients - Export",
  description: "Export du chiffre d'affaire et règlement clients",
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
          <h2 className="text-2xl font-bold tracking-tight">Chiffre d'affaire et Règlement Clients</h2>
          <p className="text-muted-foreground">
            Export du chiffre d'affaire et règlement clients avec filtres par date, client et mode de paiement
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            filterCount={2}
            cellWidths={[
              "3rem",
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
        }
      >
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
          <h2 className="text-2xl font-bold tracking-tight">Chiffre d'affaire et Règlement Clients</h2>
          <p className="text-muted-foreground">
            Export du chiffre d'affaire et règlement clients avec filtres par date, client et mode de paiement
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={8}
        filterCount={2}
        cellWidths={[
          "3rem",
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


