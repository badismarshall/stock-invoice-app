import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/data/user/user-auth";
import { getDeliveryNoteCancellationByIdAction } from "../../_lib/actions";
import { ModifyCancellationForm } from "./_components/modify-cancellation-form";

export const metadata: Metadata = {
  title: "Modifier Annulation de Bon de Livraison",
  description: "Modifier une annulation de bon de livraison",
};

async function ModifyCancellationPageContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const cancellationResult = await getDeliveryNoteCancellationByIdAction({ id });

  if (!cancellationResult.data) {
    notFound();
  }

  return <ModifyCancellationForm cancellation={cancellationResult.data} />;
}

function ModifyCancellationPageLoading() {
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

export default function ModifyCancellationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ModifyCancellationPageLoading />}>
      <ModifyCancellationPageContentWrapper params={params} />
    </Suspense>
  );
}

async function ModifyCancellationPageContentWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModifyCancellationPageContent id={id} />;
}

