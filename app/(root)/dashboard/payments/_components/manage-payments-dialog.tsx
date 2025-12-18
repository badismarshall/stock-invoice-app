"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { PaymentForm } from "../../invoices/_components/payment-form";
import { getPaymentsByInvoiceId, deletePayment } from "../_lib/actions";
import { getInvoiceById } from "../../invoices/_lib/actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManagePaymentsDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Espèces",
  check: "Chèque",
  transfer: "Virement",
  other: "Autre",
};

export function ManagePaymentsDialog({
  invoiceId,
  open,
  onOpenChange,
}: ManagePaymentsDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [editingPaymentId, setEditingPaymentId] = React.useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = React.useState<string | null>(null);
  const [paymentsData, setPaymentsData] = React.useState<{
    payments: Array<{
      id: string;
      paymentNumber: string;
      paymentDate: Date;
      amount: number;
      paymentMethod: string;
      reference: string | null;
      notes: string | null;
      createdByName: string | null;
    }>;
    totalPaid: number;
    invoiceTotal: number;
    remainingAmount: number;
  } | null>(null);
  const [invoiceInfo, setInvoiceInfo] = React.useState<{
    invoiceNumber: string;
    invoiceType: string;
  } | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsResult, invoiceResult] = await Promise.all([
        getPaymentsByInvoiceId({ invoiceId }),
        getInvoiceById({ id: invoiceId }),
      ]);

      if (paymentsResult.data) {
        setPaymentsData(paymentsResult.data);
      }

      if (invoiceResult.data) {
        setInvoiceInfo({
          invoiceNumber: invoiceResult.data.invoiceNumber,
          invoiceType: invoiceResult.data.invoiceType || "",
        });
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des paiements");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  React.useEffect(() => {
    if (open) {
      loadData();
      setShowPaymentForm(false);
      setEditingPaymentId(null);
    }
  }, [open, loadData]);

  const handleAddPayment = () => {
    setEditingPaymentId(null);
    setShowPaymentForm(true);
  };

  const handleEditPayment = (paymentId: string) => {
    setEditingPaymentId(paymentId);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async () => {
    if (!deletingPaymentId) return;

    try {
      const result = await deletePayment({ id: deletingPaymentId });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Paiement supprimé avec succès");
        setDeletingPaymentId(null);
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du paiement");
      console.error(error);
    }
  };

  const handlePaymentFormSuccess = () => {
    setShowPaymentForm(false);
    setEditingPaymentId(null);
    loadData();
  };

  if (!paymentsData) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gérer les paiements</DialogTitle>
            <DialogDescription>
              {invoiceInfo && `Facture: ${invoiceInfo.invoiceNumber}`}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center">Chargement...</div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-lg font-semibold">
                    {paymentsData.invoiceTotal.toFixed(2)} DZD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant payé</p>
                  <p className="text-lg font-semibold text-green-600">
                    {paymentsData.totalPaid.toFixed(2)} DZD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant restant</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {paymentsData.remainingAmount.toFixed(2)} DZD
                  </p>
                </div>
              </div>

              {/* Payments Table */}
              {!showPaymentForm ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Historique des paiements</h3>
                    <Button onClick={handleAddPayment} disabled={paymentsData.remainingAmount <= 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un paiement
                    </Button>
                  </div>

                  {paymentsData.payments.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Aucun paiement enregistré
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Paiement</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Méthode</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Créé par</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsData.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                {payment.paymentNumber}
                              </TableCell>
                              <TableCell>
                                {format(payment.paymentDate, "PPP", { locale: fr })}
                              </TableCell>
                              <TableCell>
                                {payment.amount.toFixed(2)} DZD
                              </TableCell>
                              <TableCell>
                                {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                              </TableCell>
                              <TableCell>
                                {payment.reference || "-"}
                              </TableCell>
                              <TableCell>
                                {payment.createdByName || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditPayment(payment.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingPaymentId(payment.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {editingPaymentId ? "Modifier le paiement" : "Nouveau paiement"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setEditingPaymentId(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <PaymentForm
                    invoiceId={invoiceId}
                    invoiceTotal={paymentsData.invoiceTotal}
                    totalPaid={editingPaymentId
                      ? paymentsData.totalPaid - (paymentsData.payments.find(p => p.id === editingPaymentId)?.amount || 0)
                      : paymentsData.totalPaid}
                    paymentId={editingPaymentId || undefined}
                    onSuccess={handlePaymentFormSuccess}
                    onCancel={() => {
                      setShowPaymentForm(false);
                      setEditingPaymentId(null);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(open) => !open && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

