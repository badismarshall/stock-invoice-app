import "server-only";
import { z } from "zod";

export const userSchema = z.object({
    users: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            emailVerified: z.boolean(),
            role: z.string(),
            banned: z.boolean(),
            createdAt: z.date(),
    })),
    options: z.object({
       totalCount: z.number(),
       limit: z.number(),
       offset: z.number(),
    }),
});

export type UserDTO = z.infer<typeof userSchema>;

// Type for a single user item in the DTO
export type UserDTOItem = UserDTO["users"][number];

export type UserRoleCounts = Record<string, number>;
export type UserBannedCounts = {
    banned: number;
    active: number;
};
export type UserEmailVerifiedCounts = {
    verified: number;
    unverified: number;
};