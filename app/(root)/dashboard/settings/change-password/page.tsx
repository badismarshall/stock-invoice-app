import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { ChangePasswordForm } from "./_components/change-password-form";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export const metadata: Metadata = {
  title: "Changer le mot de passe",
  description: "Modifiez votre mot de passe pour sécuriser votre compte",
};

async function ChangePasswordPageContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(`/sign-in`);
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Changer le mot de passe</h2>
          <p className="text-muted-foreground">
            Modifiez votre mot de passe pour sécuriser votre compte
          </p>
        </div>
      </div>
      <ChangePasswordForm />
    </div>
  );
}

function ChangePasswordPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Changer le mot de passe</h2>
          <p className="text-muted-foreground">
            Modifiez votre mot de passe pour sécuriser votre compte
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

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<ChangePasswordPageLoading />}>
      <ChangePasswordPageContent />
    </Suspense>
  );
}

