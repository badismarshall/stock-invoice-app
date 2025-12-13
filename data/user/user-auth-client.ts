'use client'

import { authClient } from '@/lib/auth-client'

export const getCurrentUser = async () => {
    try {
        const result = await authClient.getSession()
        // Better Auth client getSession returns { data: { user: ... } }
        if (!result?.data?.user) {
            return null
        }
        const user = result.data.user
        return {
            name: user.name || '',
            email: user.email || '',
        }
    } catch (error) {
        console.error('Error getting current user', error)
        return null
    }
}
