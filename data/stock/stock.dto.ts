import "server-only";
import { z } from "zod";

export const stockCurrentSchema = z.object({
  stock: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      productCode: z.string().nullable(),
      productName: z.string().nullable(),
      categoryName: z.string().nullable(),
      unitOfMeasure: z.string().nullable(),
      quantityAvailable: z.number(),
      averageCost: z.number(),
      stockValue: z.number(), // quantityAvailable * averageCost
      lastMovementDate: z.date().nullable(),
      lastUpdated: z.date(),
    })
  ),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
  summary: z.object({
    totalStockValue: z.number(),
    totalProducts: z.number(),
    lowStockCount: z.number(),
  }),
});

export type StockCurrentDTO = z.infer<typeof stockCurrentSchema>;
export type StockCurrentDTOItem = StockCurrentDTO["stock"][number];

export const stockMovementSchema = z.object({
  movements: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      productCode: z.string().nullable(),
      productName: z.string().nullable(),
      movementType: z.string(),
      movementSource: z.string(),
      referenceType: z.string().nullable(),
      referenceId: z.string().nullable(),
      quantity: z.number(),
      unitCost: z.number().nullable(),
      totalCost: z.number().nullable(), // quantity * unitCost
      movementDate: z.date(),
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

export type StockMovementDTO = z.infer<typeof stockMovementSchema>;
export type StockMovementDTOItem = StockMovementDTO["movements"][number];

