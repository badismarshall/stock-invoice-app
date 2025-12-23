import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/data/user/user-auth";
import { getProformaInvoiceById } from "@/app/(root)/dashboard/export/proforma/_lib/actions";
import { ModifyProformaInvoiceForm } from "./_components/modify-proforma-invoice-form";

export const metadata: Metadata = {
  title: "Modifier Facture Proforma",
  description: "Modifier une facture proforma",
};

async function ModifyProformaInvoicePageContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const invoiceResult = await getProformaInvoiceById({ id });

  if (!invoiceResult.data) {
    notFound();
  }

  // Adapt the data to match the expected interface
  const invoiceData = {
    ...invoiceResult.data,
    clientId: invoiceResult.data.client?.id || null,
  };

  return <ModifyProformaInvoiceForm invoice={invoiceData} />;
}

function ModifyProformaInvoicePageLoading() {
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

export default function ModifyProformaInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ModifyProformaInvoicePageLoading />}>
      <ModifyProformaInvoicePageContentWrapper params={params} />
    </Suspense>
  );
}

async function ModifyProformaInvoicePageContentWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModifyProformaInvoicePageContent id={id} />;
}

