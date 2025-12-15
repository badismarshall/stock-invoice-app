import "server-only";
import { z } from "zod";

export const deliveryNoteSchema = z.object({
  deliveryNotes: z.array(
    z.object({
      id: z.string(),
      noteNumber: z.string(),
      noteType: z.string(),
      clientId: z.string().nullable(),
      clientName: z.string().nullable(),
      noteDate: z.date(),
      status: z.string(),
      currency: z.string().nullable(),
      destinationCountry: z.string().nullable(),
      deliveryLocation: z.string().nullable(),
      notes: z.string().nullable(),
      createdBy: z.string().nullable(),
      createdByName: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      totalAmount: z.number().optional(), // Calculated from items
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type DeliveryNoteDTO = z.infer<typeof deliveryNoteSchema>;
export type DeliveryNoteDTOItem = DeliveryNoteDTO["deliveryNotes"][number];

export const deliveryNoteItemSchema = z.object({
  id: z.string(),
  deliveryNoteId: z.string(),
  productId: z.string(),
  productCode: z.string().nullable(),
  productName: z.string().nullable(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountPercent: z.number(),
  lineTotal: z.number(),
});

export type DeliveryNoteItemDTO = z.infer<typeof deliveryNoteItemSchema>;


