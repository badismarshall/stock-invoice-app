import { adminClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { ac, admin as adminAc } from "./permissions";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000",
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
})


export const { 
    signIn, 
    signUp, 
    signOut, 
    useSession 
} = authClient;