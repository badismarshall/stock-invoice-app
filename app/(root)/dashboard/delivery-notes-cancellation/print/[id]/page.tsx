import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { PrintCancellationContent } from "./_components/print-cancellation-content"

export const metadata: Metadata = {
    title: "Imprimer Bon de Livraison Avoir",
    description: "Impression du bon de livraison avoir",
}

interface PrintCancellationPageProps {
  params: Promise<{ id: string }>;
}

async function PrintCancellationPageContent(props: PrintCancellationPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const params = await props.params;
    return <PrintCancellationContent cancellationId={params.id} />
}

export default function PrintCancellationPage(props: PrintCancellationPageProps) {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <PrintCancellationPageContent {...props} />
    </Suspense>
  );
}

