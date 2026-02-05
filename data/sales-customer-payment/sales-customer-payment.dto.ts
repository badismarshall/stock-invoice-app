import * as z from "zod";

export const salesCustomerPaymentItemSchema = z.object({
  id: z.string(),
  date: z.date(),
  clientName: z.string().nullable(),
  clientId: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  invoiceId: z.string().nullable(),
  saleAmount: z.string(), // Montant Vente (totalAmount de la facture)
  creditNoteAmount: z.string(), // Montant Avoir (montant des factures annulées)
  paymentMethod: z.string().nullable(), // Mode de réglement
  paymentAmount: z.string(), // Valeur Réglé (amount du paiement)
  currency: z.string().nullable(),
});

export const salesCustomerPaymentSchema = z.object({
  payments: z.array(salesCustomerPaymentItemSchema),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type SalesCustomerPaymentDTO = z.infer<typeof salesCustomerPaymentSchema>;
export type SalesCustomerPaymentDTOItem = SalesCustomerPaymentDTO["payments"][number];

