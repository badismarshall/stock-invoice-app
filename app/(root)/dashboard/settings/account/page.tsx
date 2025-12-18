import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserWithDetails } from "@/data/user/user-auth";
import { Suspense } from "react";
import { AccountContent } from "./_components/account-content";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Gérez vos informations de compte",
};

async function AccountPageContent() {
  const user = await getCurrentUserWithDetails();
  
  if (!user) {
    redirect(`/sign-in`);
  }

  return <AccountContent user={user} />;
}

function AccountPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mon compte</h2>
          <p className="text-muted-foreground">
            Gérez vos informations de compte
          </p>
        </div>
      </div>
      <DataTableSkeleton
        columnCount={1}
        filterCount={0}
        cellWidths={["100%"]}
        shrinkZero
      />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountPageLoading />}>
      <AccountPageContent />
    </Suspense>
  );
}

