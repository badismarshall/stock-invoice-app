import 'server-only'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { cache } from 'react'


export const getCurrentUser = cache(async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        if (!session) {
            return null
        }
        return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
        }
    } catch (error) {
        console.error('Error getting current user', error)
        return null
    }
  })