import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { ModifyPurchaseForm } from "./_components/modify-purchase-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getPurchaseOrderByIdAction } from "../../_lib/actions"

export const metadata: Metadata = {
    title: "Modifier Bon de Commande",
    description: "Modifier un bon de commande",
}

async function ModifyPurchasePageContent({ id }: { id: string }) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const purchaseOrderResult = await getPurchaseOrderByIdAction({ id });
    
    if (!purchaseOrderResult.data) {
      notFound();
    }

    return <ModifyPurchaseForm purchaseOrder={purchaseOrderResult.data} />
}

function ModifyPurchasePageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 bg-card border border-border" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-card border border-border" />
            <Skeleton className="h-4 w-64 bg-card border border-border" />
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
        <Skeleton className="h-64 w-full bg-card border border-border" />
      </div>
    </div>
  );
}

export default function ModifyPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ModifyPurchasePageLoading />}>
      <ModifyPurchasePageContentWrapper params={params} />
    </Suspense>
  );
}

async function ModifyPurchasePageContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModifyPurchasePageContent id={id} />;
}

