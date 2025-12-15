import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { NewDeliveryNoteForm } from "./_components/new-delivery-note-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
    title: "Nouveau Bon de Livraison",
    description: "Création d'un nouveau bon de livraison pour vente locale",
}

async function NewDeliveryNotePageContent() {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    return <NewDeliveryNoteForm />
}

function NewDeliveryNotePageLoading() {
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

export default function NewDeliveryNotePage() {
  return (
    <Suspense fallback={<NewDeliveryNotePageLoading />}>
      <NewDeliveryNotePageContent />
    </Suspense>
  );
}


