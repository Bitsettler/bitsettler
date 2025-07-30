import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { Database } from '@/lib/spacetime-db-new/shared/supabase-client'

// Server-side Supabase client
export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Create client with user session for server components
export function createServerClientWithAuth() {
  const cookieStore = cookies()
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Get session for API routes - replacement for getServerSession
export async function getSupabaseSession(request?: NextRequest) {
  try {
    let authHeader: string | null = null
    
    if (request) {
      // Get from request headers
      authHeader = request.headers.get('authorization')
    } else {
      // Try to get from cookies for server components
      const supabase = createServerClientWithAuth()
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      return session
    }

    if (!authHeader) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }

    return {
      user,
      access_token: token,
      expires_at: user.email_confirmed_at ? undefined : Date.now() + 3600000 // 1 hour fallback
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Helper to require authentication in API routes
export async function requireAuth(request: NextRequest) {
  const session = await getSupabaseSession(request)
  
  if (!session?.user) {
    return {
      error: 'Unauthorized',
      status: 401
    }
  }
  
  return {
    session,
    user: session.user
  }
}

// Helper to get user from Supabase auth
export async function getCurrentUser() {
  const supabase = createServerClientWithAuth()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

// Type definitions matching NextAuth structure for easier migration
export type SupabaseSession = {
  user: {
    id: string
    name?: string
    email?: string
    image?: string
  }
  access_token?: string
  expires_at?: number
}

export type SupabaseUser = {
  id: string
  email?: string
  user_metadata: {
    name?: string
    avatar_url?: string
    preferred_username?: string
  }
}