import "server-only";
import { z } from "zod";

export const deliveryNoteCancellationSchema = z.object({
  cancellations: z.array(
    z.object({
      id: z.string(),
      cancellationNumber: z.string(),
      originalDeliveryNoteId: z.string().nullable(),
      clientId: z.string().nullable(),
      clientName: z.string().nullable(),
      cancellationDate: z.date(),
      reason: z.string().nullable(),
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

export type DeliveryNoteCancellationDTO = z.infer<typeof deliveryNoteCancellationSchema>;
export type DeliveryNoteCancellationDTOItem = DeliveryNoteCancellationDTO["cancellations"][number];

