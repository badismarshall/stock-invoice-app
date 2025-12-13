import "server-only";
import { z } from "zod";

export const categorySchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      isActive: z.boolean(),
      createdAt: z.date(),
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type CategoryDTO = z.infer<typeof categorySchema>;
export type CategoryDTOItem = CategoryDTO["categories"][number];

