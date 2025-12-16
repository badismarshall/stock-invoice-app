import "server-only";
import { z } from "zod";

export const deliveryNoteCancellationItemSchema = z.object({
  id: z.string(),
  deliveryNoteCancellationId: z.string(),
  deliveryNoteItemId: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountPercent: z.number(),
  lineTotal: z.number(),
});

export type DeliveryNoteCancellationItemDTO = z.infer<typeof deliveryNoteCancellationItemSchema>;

export const clientDeliveryNoteItemSchema = z.object({
  deliveryNoteItemId: z.string(),
  deliveryNoteId: z.string(),
  noteNumber: z.string(),
  noteDate: z.date(),
  productId: z.string(),
  productName: z.string().nullable(),
  productCode: z.string().nullable(),
  originalQuantity: z.number(),
  cancelledQuantity: z.number(),
  availableQuantity: z.number(),
  unitPrice: z.number(),
  discountPercent: z.number(),
  lineTotal: z.number(),
});

export type ClientDeliveryNoteItemDTO = z.infer<typeof clientDeliveryNoteItemSchema>;

