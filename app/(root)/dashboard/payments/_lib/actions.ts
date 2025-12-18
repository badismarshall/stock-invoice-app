"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { payment, invoice } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import {
  getPayments as getPaymentsDAL,
  getPaymentById as getPaymentByIdDAL,
  getPaymentsByInvoiceId as getPaymentsByInvoiceIdDAL,
  getTotalPaidForInvoice as getTotalPaidForInvoiceDAL,
} from "@/data/payment/payment.dal";
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from "@/data/payment/payment.dto";

/**
 * Calculate and update invoice payment status
 * This function is exported so it can be used by other modules if needed
 * Note: updateTag should NOT be called here - it should be called in the calling function
 */
export async function updateInvoicePaymentStatus(invoiceId: string) {
  try {
    const invoiceData = await db
      .select({
        id: invoice.id,
        totalAmount: invoice.totalAmount,
      })
      .from(invoice)
      .where(eq(invoice.id, invoiceId))
      .limit(1);

    if (invoiceData.length === 0) {
      return;
    }

    const totalPaid = await getTotalPaidForInvoiceDAL(invoiceId);
    const invoiceTotal = parseFloat(invoiceData[0].totalAmount);

    // Determine payment status with tolerance for rounding
    let paymentStatus: "unpaid" | "partially_paid" | "paid";
    const tolerance = 0.01; // 1 centime tolerance
    
    if (totalPaid <= tolerance) {
      paymentStatus = "unpaid";
    } else if (totalPaid >= invoiceTotal - tolerance) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "partially_paid";
    }

    // Update invoice payment status
    await db
      .update(invoice)
      .set({ paymentStatus })
      .where(eq(invoice.id, invoiceId));

    // Don't call updateTag here - it should be called in the calling Server Action
  } catch (error) {
    console.error("Error updating invoice payment status", error);
    throw error; // Re-throw to let the transaction handle it
  }
}

/**
 * Create a new payment
 */
export async function createPayment(input: CreatePaymentInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get invoice to validate and determine client/supplier
    const invoiceData = await db
      .select({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        totalAmount: invoice.totalAmount,
        clientId: invoice.clientId,
        supplierId: invoice.supplierId,
      })
      .from(invoice)
      .where(eq(invoice.id, input.invoiceId))
      .limit(1);

    if (invoiceData.length === 0) {
      return {
        data: null,
        error: "Facture non trouvée",
      };
    }

    const invoiceInfo = invoiceData[0];

    // Calculate remaining amount
    const totalPaid = await getTotalPaidForInvoiceDAL(input.invoiceId);
    const invoiceTotal = parseFloat(invoiceInfo.totalAmount);
    const remainingAmount = invoiceTotal - totalPaid;

    // Validate amount
    if (input.amount > remainingAmount + 0.01) { // tolerance
      return {
        data: null,
        error: `Le montant (${input.amount.toFixed(2)}) dépasse le montant restant (${remainingAmount.toFixed(2)})`,
      };
    }

    // Determine clientId or supplierId based on invoice type
    const clientId = invoiceInfo.clientId;
    const supplierId = invoiceInfo.supplierId;

    if (!clientId && !supplierId) {
      return {
        data: null,
        error: "La facture n'a ni client ni fournisseur",
      };
    }

    // Generate payment number
    const paymentId = generateId();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // Check if payment number already exists
    const existingPayment = await db
      .select({ id: payment.id })
      .from(payment)
      .where(eq(payment.paymentNumber, paymentNumber))
      .limit(1);

    if (existingPayment.length > 0) {
      return {
        data: null,
        error: `Le numéro de paiement "${paymentNumber}" existe déjà`,
      };
    }

    // Format payment date
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const paymentDateValue = formatDateLocal(input.paymentDate);

    await db.transaction(async (tx) => {
      // Insert payment
      await tx.insert(payment).values({
        id: paymentId,
        paymentNumber: paymentNumber,
        invoiceId: input.invoiceId,
        clientId: clientId || null,
        supplierId: supplierId || null,
        paymentDate: paymentDateValue,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        reference: input.reference || null,
        notes: input.notes || null,
        createdBy: user.id,
      });

      // Calculate and update invoice payment status within transaction
      const invoiceData = await tx
        .select({
          id: invoice.id,
          totalAmount: invoice.totalAmount,
        })
        .from(invoice)
        .where(eq(invoice.id, input.invoiceId))
        .limit(1);

      if (invoiceData.length > 0) {
        // Get total paid using the transaction context
        const paymentsResult = await tx
          .select({
            amount: payment.amount,
          })
          .from(payment)
          .where(eq(payment.invoiceId, input.invoiceId));

        const totalPaid = paymentsResult.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const invoiceTotal = parseFloat(invoiceData[0].totalAmount);

        // Determine payment status with tolerance for rounding
        let paymentStatus: "unpaid" | "partially_paid" | "paid";
        const tolerance = 0.01;
        
        if (totalPaid <= tolerance) {
          paymentStatus = "unpaid";
        } else if (totalPaid >= invoiceTotal - tolerance) {
          paymentStatus = "paid";
        } else {
          paymentStatus = "partially_paid";
        }

        // Update invoice payment status within transaction
        await tx
          .update(invoice)
          .set({ paymentStatus })
          .where(eq(invoice.id, input.invoiceId));
      }
    });

    // Update tags after successful transaction (outside of transaction)
    updateTag("payments");
    updateTag("invoices");

    return {
      data: { id: paymentId, paymentNumber },
      error: null,
    };
  } catch (err) {
    console.error("Error creating payment", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Update an existing payment
 */
export async function updatePayment(input: UpdatePaymentInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get existing payment
    const existingPayment = await db
      .select({
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
      })
      .from(payment)
      .where(eq(payment.id, input.id))
      .limit(1);

    if (existingPayment.length === 0) {
      return {
        data: null,
        error: "Paiement non trouvé",
      };
    }

    const paymentInfo = existingPayment[0];
    const oldAmount = parseFloat(paymentInfo.amount);

    // Get invoice
    const invoiceData = await db
      .select({
        id: invoice.id,
        totalAmount: invoice.totalAmount,
      })
      .from(invoice)
      .where(eq(invoice.id, paymentInfo.invoiceId))
      .limit(1);

    if (invoiceData.length === 0) {
      return {
        data: null,
        error: "Facture non trouvée",
      };
    }

    // Calculate remaining amount (excluding the old payment amount)
    const totalPaid = await getTotalPaidForInvoiceDAL(paymentInfo.invoiceId);
    const invoiceTotal = parseFloat(invoiceData[0].totalAmount);
    const remainingAmount = invoiceTotal - (totalPaid - oldAmount);

    // Validate new amount
    if (input.amount > remainingAmount + 0.01) { // tolerance
      return {
        data: null,
        error: `Le montant (${input.amount.toFixed(2)}) dépasse le montant restant (${remainingAmount.toFixed(2)})`,
      };
    }

    // Format payment date
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const paymentDateValue = formatDateLocal(input.paymentDate);

    await db.transaction(async (tx) => {
      // Update payment
      await tx
        .update(payment)
        .set({
          paymentDate: paymentDateValue,
          amount: input.amount.toString(),
          paymentMethod: input.paymentMethod,
          reference: input.reference || null,
          notes: input.notes || null,
        })
        .where(eq(payment.id, input.id));

      // Calculate and update invoice payment status within transaction
      const invoiceDataForUpdate = await tx
        .select({
          id: invoice.id,
          totalAmount: invoice.totalAmount,
        })
        .from(invoice)
        .where(eq(invoice.id, paymentInfo.invoiceId))
        .limit(1);

      if (invoiceDataForUpdate.length > 0) {
        // Get total paid using the transaction context
        const paymentsResult = await tx
          .select({
            amount: payment.amount,
          })
          .from(payment)
          .where(eq(payment.invoiceId, paymentInfo.invoiceId));

        const totalPaid = paymentsResult.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const invoiceTotal = parseFloat(invoiceDataForUpdate[0].totalAmount);

        // Determine payment status with tolerance for rounding
        let paymentStatus: "unpaid" | "partially_paid" | "paid";
        const tolerance = 0.01;
        
        if (totalPaid <= tolerance) {
          paymentStatus = "unpaid";
        } else if (totalPaid >= invoiceTotal - tolerance) {
          paymentStatus = "paid";
        } else {
          paymentStatus = "partially_paid";
        }

        // Update invoice payment status within transaction
        await tx
          .update(invoice)
          .set({ paymentStatus })
          .where(eq(invoice.id, paymentInfo.invoiceId));
      }
    });

    updateTag("payments");
    updateTag("invoices");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating payment", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get payment to get invoiceId
    const paymentData = await db
      .select({
        id: payment.id,
        invoiceId: payment.invoiceId,
      })
      .from(payment)
      .where(eq(payment.id, input.id))
      .limit(1);

    if (paymentData.length === 0) {
      return {
        data: null,
        error: "Paiement non trouvé",
      };
    }

    const invoiceId = paymentData[0].invoiceId;

    await db.transaction(async (tx) => {
      // Delete payment
      await tx.delete(payment).where(eq(payment.id, input.id));

      // Calculate and update invoice payment status within transaction
      const invoiceDataForDelete = await tx
        .select({
          id: invoice.id,
          totalAmount: invoice.totalAmount,
        })
        .from(invoice)
        .where(eq(invoice.id, invoiceId))
        .limit(1);

      if (invoiceDataForDelete.length > 0) {
        // Get total paid using the transaction context
        const paymentsResult = await tx
          .select({
            amount: payment.amount,
          })
          .from(payment)
          .where(eq(payment.invoiceId, invoiceId));

        const totalPaid = paymentsResult.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const invoiceTotal = parseFloat(invoiceDataForDelete[0].totalAmount);

        // Determine payment status with tolerance for rounding
        let paymentStatus: "unpaid" | "partially_paid" | "paid";
        const tolerance = 0.01;
        
        if (totalPaid <= tolerance) {
          paymentStatus = "unpaid";
        } else if (totalPaid >= invoiceTotal - tolerance) {
          paymentStatus = "paid";
        } else {
          paymentStatus = "partially_paid";
        }

        // Update invoice payment status within transaction
        await tx
          .update(invoice)
          .set({ paymentStatus })
          .where(eq(invoice.id, invoiceId));
      }
    });

    updateTag("payments");
    updateTag("invoices");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting payment", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(input: { id: string }) {
  try {
    const paymentData = await getPaymentByIdDAL(input.id);
    if (!paymentData) {
      return {
        data: null,
        error: "Paiement non trouvé",
      };
    }
    return {
      data: paymentData,
      error: null,
    };
  } catch (err) {
    console.error("Error getting payment by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all payments for an invoice
 */
export async function getPaymentsByInvoiceId(input: { invoiceId: string }) {
  try {
    const payments = await getPaymentsByInvoiceIdDAL(input.invoiceId);
    const totalPaid = await getTotalPaidForInvoiceDAL(input.invoiceId);

    // Get invoice total
    const invoiceData = await db
      .select({
        totalAmount: invoice.totalAmount,
      })
      .from(invoice)
      .where(eq(invoice.id, input.invoiceId))
      .limit(1);

    const invoiceTotal = invoiceData.length > 0
      ? parseFloat(invoiceData[0].totalAmount)
      : 0;

    return {
      data: {
        payments,
        totalPaid,
        invoiceTotal,
        remainingAmount: invoiceTotal - totalPaid,
      },
      error: null,
    };
  } catch (err) {
    console.error("Error getting payments by invoice ID", err);
    return {
      data: {
        payments: [],
        totalPaid: 0,
        invoiceTotal: 0,
        remainingAmount: 0,
      },
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all payment methods
 */
export async function getAllPaymentMethods() {
  return {
    data: [
      { value: "cash", label: "Espèces" },
      { value: "check", label: "Chèque" },
      { value: "transfer", label: "Virement" },
      { value: "other", label: "Autre" },
    ],
    error: null,
  };
}

