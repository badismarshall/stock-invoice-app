import "server-only";
import { z } from "zod";

export const paymentSchema = z.object({
  payments: z.array(
    z.object({
      id: z.string(),
      paymentNumber: z.string(),
      invoiceId: z.string(),
      invoiceNumber: z.string().nullable(),
      invoiceType: z.string().nullable(),
      clientId: z.string().nullable(),
      clientName: z.string().nullable(),
      supplierId: z.string().nullable(),
      supplierName: z.string().nullable(),
      paymentDate: z.date(),
      amount: z.number(),
      paymentMethod: z.string(),
      reference: z.string().nullable(),
      notes: z.string().nullable(),
      createdBy: z.string().nullable(),
      createdByName: z.string().nullable(),
      createdAt: z.date(),
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type PaymentDTO = z.infer<typeof paymentSchema>;
export type PaymentDTOItem = PaymentDTO["payments"][number];

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "L'ID de la facture est requis"),
  paymentDate: z.date(),
  amount: z.number().positive("Le montant doit être positif"),
  paymentMethod: z.enum(["cash", "check", "transfer", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = z.object({
  id: z.string().min(1, "L'ID du paiement est requis"),
  paymentDate: z.date(),
  amount: z.number().positive("Le montant doit être positif"),
  paymentMethod: z.enum(["cash", "check", "transfer", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

