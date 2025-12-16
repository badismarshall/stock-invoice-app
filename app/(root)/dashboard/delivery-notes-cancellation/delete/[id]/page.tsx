import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/data/user/user-auth";
import { getDeliveryNoteCancellationByIdAction } from "../../_lib/actions";
import { DeleteCancellationForm } from "./_components/delete-cancellation-form";

export const metadata: Metadata = {
  title: "Supprimer Annulation de Bon de Livraison",
  description: "Supprimer une annulation de bon de livraison",
};

async function DeleteCancellationPageContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const cancellationResult = await getDeliveryNoteCancellationByIdAction({ id });

  if (!cancellationResult.data) {
    notFound();
  }

  return <DeleteCancellationForm cancellation={cancellationResult.data} />;
}

function DeleteCancellationPageLoading() {
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

export default function DeleteCancellationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DeleteCancellationPageLoading />}>
      <DeleteCancellationPageContentWrapper params={params} />
    </Suspense>
  );
}

async function DeleteCancellationPageContentWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeleteCancellationPageContent id={id} />;
}

