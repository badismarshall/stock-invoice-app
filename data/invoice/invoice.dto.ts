import "server-only";
import { z } from "zod";

export const invoiceSchema = z.object({
  invoices: z.array(
    z.object({
      id: z.string(),
      invoiceNumber: z.string(),
      invoiceType: z.string(),
      clientId: z.string().nullable(),
      clientName: z.string().nullable(),
      supplierId: z.string().nullable(),
      supplierName: z.string().nullable(),
      deliveryNoteId: z.string().nullable(),
      invoiceDate: z.date(),
      dueDate: z.date().nullable(),
      currency: z.string().nullable(),
      destinationCountry: z.string().nullable(),
      deliveryLocation: z.string().nullable(),
      subtotal: z.number(),
      taxAmount: z.number(),
      totalAmount: z.number(),
      paymentStatus: z.string(),
      status: z.string(),
      paymentMethod: z.string().nullable(),
      notes: z.string().nullable(),
      createdBy: z.string().nullable(),
      createdByName: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      isOverdue: z.boolean().optional(), // Calculated: dueDate < today && paymentStatus !== 'paid'
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
  summary: z.object({
    totalInvoices: z.number(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    unpaidAmount: z.number(),
    partiallyPaidAmount: z.number(),
    unpaidCount: z.number(),
    partiallyPaidCount: z.number(),
    paidCount: z.number(),
    overdueCount: z.number(),
  }),
});

export type InvoiceDTO = z.infer<typeof invoiceSchema>;
export type InvoiceDTOItem = InvoiceDTO["invoices"][number];

