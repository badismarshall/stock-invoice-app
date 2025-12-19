"use client";

import { adminClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { ac, admin as adminAc } from "./permissions";

// Create auth client with dynamic baseURL
// Better Auth will use window.location.origin when available (client-side)
// This ensures it works on both localhost and Vercel deployments
export const authClient = createAuthClient(
    typeof window !== "undefined"
        ? {
            // Client-side: use current origin (works for localhost and Vercel)
            plugins: [
                organizationClient({
                    ac,
                    roles: {
                        adminAc,
                    },
                    dynamicAccessControl: {
                        enabled: true,
                    },
                    defaultRole: "user",
                }),
                adminClient(),
            ],
        }
        : {
            // Server-side: Better Auth will auto-detect
            plugins: [
                organizationClient({
                    ac,
                    roles: {
                        adminAc,
                    },
                    dynamicAccessControl: {
                        enabled: true,
                    },
                    defaultRole: "user",
                }),
                adminClient(),
            ],
        }
)


export const { 
    signIn, 
    signUp, 
    signOut, 
    useSession 
} = authClient;