import "server-only";
import { z } from "zod";

export const partnerSchema = z.object({
    partners: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            contact: z.string().nullable(),
            phone: z.string().nullable(),
            email: z.string().nullable(),
            address: z.string().nullable(),
            credit: z.string().nullable(), // numeric as string
            nif: z.string().nullable(),
            rc: z.string().nullable(),
            type: z.string(), // "client" or "fournisseur"
            createdAt: z.date(),
            updatedAt: z.date(),
    })),
    options: z.object({
       totalCount: z.number(),
       limit: z.number(),
       offset: z.number(),
    }),
});

export type PartnerDTO = z.infer<typeof partnerSchema>;

// Type for a single partner item in the DTO
export type PartnerDTOItem = PartnerDTO["partners"][number];

