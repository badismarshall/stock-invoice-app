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
        // During prerendering, headers() rejects when the prerender is complete
        // This is expected and we should return null instead of logging an error
        if (error instanceof Error) {
            const hasPrerenderError = 
                error.message.includes('prerender') || 
                error.message.includes('headers()') ||
                ('digest' in error && (error as { digest?: string }).digest === 'HANGING_PROMISE_REJECTION');
            
            if (hasPrerenderError) {
                return null
            }
        }
        console.error('Error getting current user', error)
        return null
    }
  })