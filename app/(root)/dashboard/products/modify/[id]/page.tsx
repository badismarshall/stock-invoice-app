import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { ModifyProductForm } from "./_components/modify-product-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getProductById } from "../../_lib/actions"

export const metadata: Metadata = {
    title: "Modifier Produit",
    description: "Modifier un produit",
}

async function ModifyProductPageContent({ id }: { id: string }) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const productResult = await getProductById({ id });
    
    if (!productResult.data) {
      notFound();
    }

    return <ModifyProductForm product={productResult.data} />
}

function ModifyProductPageLoading() {
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

export default function ModifyProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ModifyProductPageLoading />}>
      <ModifyProductPageContentWrapper params={params} />
    </Suspense>
  );
}

async function ModifyProductPageContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModifyProductPageContent id={id} />;
}

