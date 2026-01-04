import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { PrintPurchaseOrderContent } from "./_components/print-purchase-order-content"

export const metadata: Metadata = {
    title: "Imprimer Bon de Commande",
    description: "Impression du bon de commande",
}

interface PrintPurchaseOrderPageProps {
  params: Promise<{ id: string }>;
}

async function PrintPurchaseOrderPageContent(props: PrintPurchaseOrderPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const params = await props.params;
    return <PrintPurchaseOrderContent purchaseOrderId={params.id} />
}

export default function PrintPurchaseOrderPage(props: PrintPurchaseOrderPageProps) {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <PrintPurchaseOrderPageContent {...props} />
    </Suspense>
  );
}

