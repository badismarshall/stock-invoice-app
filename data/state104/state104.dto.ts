import * as z from "zod";

export const state104ItemSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  address: z.string().nullable(),
  nif: z.string().nullable(),
  rcs: z.string().nullable(),
  saleAmountHT: z.string(), // Chiffre d'affaires H.T (sum of invoice subtotal)
  saleAmountTTC: z.string(), // Chiffre d'affaires TTC (sum of invoice totalAmount)
  totalTva: z.string(), // numeric as string
});

export const state104Schema = z.object({
  rows: z.array(state104ItemSchema),
  options: z.object({
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type State104DTO = z.infer<typeof state104Schema>;
export type State104DTOItem = State104DTO["rows"][number];

