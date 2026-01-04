import "server-only";
import { z } from "zod";

export const unitOfMeasureSchema = z.object({
  unitsOfMeasure: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      description: z.string().nullable(),
      isActive: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type UnitOfMeasureDTO = z.infer<typeof unitOfMeasureSchema>;
export type UnitOfMeasureDTOItem = UnitOfMeasureDTO["unitsOfMeasure"][number];

