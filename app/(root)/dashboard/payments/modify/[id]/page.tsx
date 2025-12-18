import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { ModifyPaymentContent } from "./_components/modify-payment-content";

export const metadata: Metadata = {
  title: "Modifier le Paiement",
  description: "Modifier un paiement existant",
};

interface ModifyPaymentPageProps {
  params: Promise<{ id: string }>;
}

async function ModifyPaymentPageContent(props: ModifyPaymentPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  const params = await props.params;
  return <ModifyPaymentContent paymentId={params.id} />;
}

export default function ModifyPaymentPage(props: ModifyPaymentPageProps) {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <ModifyPaymentPageContent {...props} />
    </Suspense>
  );
}

