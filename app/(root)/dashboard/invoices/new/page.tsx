import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { NewInvoiceForm } from "./_components/new-invoice-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
    title: "Nouvelle Facture",
    description: "Création d'une nouvelle facture",
}

async function NewInvoicePageContent() {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return <NewInvoiceForm />
}

function NewInvoicePageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<NewInvoicePageLoading />}>
      <NewInvoicePageContent />
    </Suspense>
  );
}

