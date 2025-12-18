import "server-only";
import { z } from "zod";

export const purchaseOrderSchema = z.object({
  purchaseOrders: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.string(),
      supplierId: z.string(),
      supplierName: z.string().nullable(),
      orderDate: z.date(),
      receptionDate: z.date().nullable(),
      status: z.string(),
      totalAmount: z.string().nullable(),
      notes: z.string().nullable(),
      createdBy: z.string().nullable(),
      createdByName: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      invoiceId: z.string().nullable(),
      invoiceNumber: z.string().nullable(),
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type PurchaseOrderDTO = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderDTOItem = PurchaseOrderDTO["purchaseOrders"][number];

