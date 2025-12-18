"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "../../../invoices/_components/payment-form";
import { getInvoiceById } from "../../../invoices/_lib/actions";
import { getPaymentsByInvoiceId } from "../../_lib/actions";
import { toast } from "sonner";

interface AddPaymentContentProps {
  invoiceId: string;
}

export function AddPaymentContent({ invoiceId }: AddPaymentContentProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [invoiceData, setInvoiceData] = React.useState<{
    invoiceNumber: string;
    invoiceTotal: number;
    totalPaid: number;
  } | null>(null);

  React.useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) {
        toast.error("ID de facture manquant");
        router.push("/dashboard/payments");
        return;
      }

      setLoading(true);
      try {
        const [invoiceResult, paymentsResult] = await Promise.all([
          getInvoiceById({ id: invoiceId }),
          getPaymentsByInvoiceId({ invoiceId }),
        ]);

        if (invoiceResult.error || !invoiceResult.data) {
          toast.error(invoiceResult.error || "Facture non trouvée");
          router.push("/dashboard/payments");
          return;
        }

        if (paymentsResult.error) {
          console.error("Payments error:", paymentsResult.error);
        }

        const invoice = invoiceResult.data;
        const totalPaid = paymentsResult.data?.totalPaid || 0;

        // Ensure totalAmount is a number
        const invoiceTotal = typeof invoice.totalAmount === 'string' 
          ? parseFloat(invoice.totalAmount) 
          : (invoice.totalAmount || 0);

        setInvoiceData({
          invoiceNumber: invoice.invoiceNumber,
          invoiceTotal: invoiceTotal,
          totalPaid: totalPaid,
        });
      } catch (error) {
        console.error("Error loading invoice:", error);
        toast.error("Erreur lors du chargement de la facture");
        router.push("/dashboard/payments");
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, router]);

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!invoiceData) {
    return null;
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ajouter un Paiement</h2>
          <p className="text-muted-foreground">
            Facture: {invoiceData.invoiceNumber}
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PaymentForm
          invoiceId={invoiceId}
          invoiceTotal={invoiceData.invoiceTotal}
          totalPaid={invoiceData.totalPaid}
          onSuccess={() => router.push(`/dashboard/payments?invoiceId=${invoiceId}`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

