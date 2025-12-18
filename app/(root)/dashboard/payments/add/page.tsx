import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { Suspense } from "react";
import { AddPaymentContent } from "./_components/add-payment-content";
import type { SearchParams } from "@/types";
import { FeatureFlagsProvider } from "../../_components/feature-flags-provider";

export const metadata: Metadata = {
  title: "Ajouter un Paiement",
  description: "Ajouter un nouveau paiement pour une facture",
};

interface AddPaymentPageProps {
  searchParams: Promise<SearchParams>;
}

async function AddPaymentPageContent(props: AddPaymentPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  const searchParams = await props.searchParams;
  const invoiceId = searchParams.invoiceId;

  if (!invoiceId || (Array.isArray(invoiceId) && invoiceId.length === 0)) {
    redirect("/dashboard/payments");
  }

  const invoiceIdValue = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;

  return (
    <FeatureFlagsProvider>
      <AddPaymentContent invoiceId={invoiceIdValue} />
    </FeatureFlagsProvider>
  );
}

export default function AddPaymentPage(props: AddPaymentPageProps) {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <AddPaymentPageContent {...props} />
    </Suspense>
  );
}

