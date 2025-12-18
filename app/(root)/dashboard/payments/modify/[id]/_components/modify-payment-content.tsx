"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "../../../../invoices/_components/payment-form";
import { getPaymentById } from "../../../_lib/actions";
import { toast } from "sonner";

interface ModifyPaymentContentProps {
  paymentId: string;
}

export function ModifyPaymentContent({ paymentId }: ModifyPaymentContentProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [paymentData, setPaymentData] = React.useState<{
    invoiceId: string;
    invoiceTotal: number;
    totalPaid: number;
    existingAmount: number;
  } | null>(null);

  React.useEffect(() => {
    const loadPayment = async () => {
      setLoading(true);
      try {
        const result = await getPaymentById({ id: paymentId });
        if (result.error || !result.data) {
          toast.error(result.error || "Paiement non trouvé");
          router.push("/dashboard/payments");
          return;
        }

        const payment = result.data;
        if (!payment.invoice) {
          toast.error("Facture non trouvée");
          router.push("/dashboard/payments");
          return;
        }

        // Get all payments for this invoice to calculate totalPaid
        const { getPaymentsByInvoiceId } = await import("../../../_lib/actions");
        const paymentsResult = await getPaymentsByInvoiceId({ invoiceId: payment.invoiceId });
        
        if (paymentsResult.data) {
          const otherPaymentsTotal = paymentsResult.data.payments
            .filter((p) => p.id !== paymentId)
            .reduce((sum, p) => sum + p.amount, 0);

          setPaymentData({
            invoiceId: payment.invoiceId,
            invoiceTotal: payment.invoice.totalAmount,
            totalPaid: otherPaymentsTotal,
            existingAmount: payment.amount,
          });
        }
      } catch (error) {
        toast.error("Erreur lors du chargement du paiement");
        console.error(error);
        router.push("/dashboard/payments");
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [paymentId, router]);

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!paymentData) {
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
          <h2 className="text-2xl font-bold tracking-tight">Modifier le Paiement</h2>
          <p className="text-muted-foreground">
            Modifiez les informations du paiement
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PaymentForm
          invoiceId={paymentData.invoiceId}
          invoiceTotal={paymentData.invoiceTotal}
          totalPaid={paymentData.totalPaid}
          paymentId={paymentId}
          onSuccess={() => router.push("/dashboard/payments")}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

