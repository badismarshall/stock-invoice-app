import { betterAuth } from "better-auth";
// import { prismaAdapter } from "better-auth/adapters/prisma";
// import { PrismaClient } from "../lib/generated/prisma";
import { admin } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins"
import { ac, admin as adminAc } from "./permissions";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db";

// const prisma = new PrismaClient();

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 600, // 10 minutes
        },
    },
    rateLimit: {
        enabled: true,
        max: 3,
        window: 60 , // 1 minute
        message: 'Too many requests, please try again later.',
    },

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    plugins: [
        organization({
            ac,
            roles: {
                adminAc,
            },
            dynamicAccessControl: {
                enabled: true,
            },
            defaultRole: "user",
        }),
        admin(),
        nextCookies() 
    ],
});

