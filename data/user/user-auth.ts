import 'server-only'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { cache } from 'react'
import db from '@/db'
import { user, member } from '@/db/schema'
import { eq, and } from 'drizzle-orm'


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

/**
 * Get current user with full details including role
 */
export const getCurrentUserWithDetails = cache(async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        if (!session) {
            return null
        }

        // Get user role from database
        const userData = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
            })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1)
            .execute();

        if (userData.length === 0) {
            return null
        }

        const userRecord = userData[0];

        // Get organization role if available
        let organizationRole = null;
        if (session.session?.activeOrganizationId) {
            try {
                const memberData = await db
                    .select({
                        role: member.role,
                    })
                    .from(member)
                    .where(
                        and(
                            eq(member.userId, session.user.id),
                            eq(member.organizationId, session.session.activeOrganizationId)
                        )
                    )
                    .limit(1)
                    .execute();
                
                if (memberData.length > 0) {
                    organizationRole = memberData[0].role || null;
                }
            } catch (err) {
                // Organization role is optional
                console.log('Could not fetch organization role:', err);
            }
        }

        return {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            role: userRecord.role,
            organizationRole: organizationRole,
            emailVerified: userRecord.emailVerified,
            image: userRecord.image,
            createdAt: userRecord.createdAt,
        }
    } catch (error) {
        if (error instanceof Error) {
            const hasPrerenderError = 
                error.message.includes('prerender') || 
                error.message.includes('headers()') ||
                ('digest' in error && (error as { digest?: string }).digest === 'HANGING_PROMISE_REJECTION');
            
            if (hasPrerenderError) {
                return null
            }
        }
        console.error('Error getting current user with details', error)
        return null
    }
  })