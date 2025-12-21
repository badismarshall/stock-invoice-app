import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/data/user/user-auth";
import { getDeliveryNoteByIdAction } from "../../../_lib/actions";
import { ModifyDeliveryNoteForm } from "./_components/modify-delivery-note-form";

export const metadata: Metadata = {
  title: "Modifier Bon de Livraison Export",
  description: "Modifier un bon de livraison pour export",
};

async function ModifyDeliveryNotePageContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const deliveryNoteResult = await getDeliveryNoteByIdAction({ id });

  if (!deliveryNoteResult.data) {
    notFound();
  }

  return <ModifyDeliveryNoteForm deliveryNote={deliveryNoteResult.data} />;
}

function ModifyDeliveryNotePageLoading() {
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

export default function ModifyDeliveryNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ModifyDeliveryNotePageLoading />}>
      <ModifyDeliveryNotePageContentWrapper params={params} />
    </Suspense>
  );
}

async function ModifyDeliveryNotePageContentWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModifyDeliveryNotePageContent id={id} />;
}


