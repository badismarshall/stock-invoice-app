import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "../_components/feature-flags-provider"
import { InvoicesContent } from "./_components/invoices-content"
import { InvoicesPageLoading } from "./_components/invoices-page-loading"

export const metadata: Metadata = {
    title: "Factures",
    description: "Gestion des factures",
}

interface InvoicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function InvoicesPageContent(props: InvoicesPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return (
      <div className="h-full flex-1 flex-col space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestion des Factures</h2>
            <p className="text-muted-foreground">
              Visualisez et gérez toutes vos factures
            </p>
          </div>
        </div>
        <Suspense fallback={<InvoicesPageLoading />}>
          <FeatureFlagsProvider>
            <InvoicesContent {...props} />
          </FeatureFlagsProvider>
        </Suspense>
      </div>
    )
}

export default function InvoicesPage(props: InvoicesPageProps) {
  return (
    <Suspense fallback={<InvoicesPageLoading />}>
      <InvoicesPageContent {...props} />
    </Suspense>
  );
}

