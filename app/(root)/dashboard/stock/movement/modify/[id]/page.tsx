import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { ModifyStockMovementForm } from "./_components/modify-stock-movement-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getStockMovementByIdAction } from "../../../_lib/actions"

export const metadata: Metadata = {
    title: "Modifier Mouvement de Stock",
    description: "Modifier un mouvement d'ajustement de stock",
}

async function ModifyStockMovementPageContent({ id }: { id: string }) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const movementResult = await getStockMovementByIdAction({ id });
    
    if (!movementResult.data) {
      notFound();
    }

    return <ModifyStockMovementForm movement={movementResult.data} />
}

function ModifyStockMovementPageLoading() {
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

export default function ModifyStockMovementPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ModifyStockMovementPageLoading />}>
      <ModifyStockMovementPageContentWrapper params={params} />
    </Suspense>
  );
}

async function ModifyStockMovementPageContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModifyStockMovementPageContent id={id} />;
}

