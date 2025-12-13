import "server-only";
import { z } from "zod";

export const productSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      categoryId: z.string().nullable(),
      categoryName: z.string().nullable(),
      unitOfMeasure: z.string(),
      purchasePrice: z.string().nullable(),
      salePriceLocal: z.string().nullable(),
      salePriceExport: z.string().nullable(),
      taxRate: z.string().nullable(),
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

export type ProductDTO = z.infer<typeof productSchema>;
export type ProductDTOItem = ProductDTO["products"][number];

