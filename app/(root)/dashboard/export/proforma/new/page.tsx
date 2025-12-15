import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { NewProformaInvoiceForm } from "./_components/new-proforma-invoice-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
    title: "Nouvelle Facture Proforma",
    description: "Création d'une nouvelle facture proforma pour vente export",
}

async function NewProformaInvoicePageContent() {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return <NewProformaInvoiceForm />
}

function NewProformaInvoicePageLoading() {
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

export default function NewProformaInvoicePage() {
  return (
    <Suspense fallback={<NewProformaInvoicePageLoading />}>
      <NewProformaInvoicePageContent />
    </Suspense>
  );
}


