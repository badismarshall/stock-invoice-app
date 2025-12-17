import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { PrintInvoiceContent } from "./_components/print-invoice-content"

export const metadata: Metadata = {
    title: "Imprimer Facture",
    description: "Impression de la facture",
}

interface PrintInvoicePageProps {
  params: Promise<{ id: string }>;
}

async function PrintInvoicePageContent(props: PrintInvoicePageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const params = await props.params;
    return <PrintInvoiceContent invoiceId={params.id} />
}

export default function PrintInvoicePage(props: PrintInvoicePageProps) {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <PrintInvoicePageContent {...props} />
    </Suspense>
  );
}

