import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { CompanySettingsForm } from "./_components/company-settings-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Paramètres de l'entreprise",
  description: "Gérer les informations de l'entreprise",
}

async function CompanySettingsPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return <CompanySettingsForm />
}

function CompanySettingsPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paramètres de l'entreprise</h2>
          <p className="text-muted-foreground">
            Gérez les informations de votre entreprise
          </p>
        </div>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <Suspense fallback={<CompanySettingsPageLoading />}>
      <CompanySettingsPageContent />
    </Suspense>
  );
}

