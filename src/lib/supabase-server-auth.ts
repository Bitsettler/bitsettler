import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { Database } from '@/lib/spacetime-db-new/shared/supabase-client'

// Create proper server client for API routes
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { httpOnly?: boolean; secure?: boolean; sameSite?: string; maxAge?: number; path?: string }) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Get session for API routes - replacement for getServerSession
export async function getSupabaseSession(request?: NextRequest) {
  try {
    console.log('getSupabaseSession called');
    
    // First try Authorization header (client-provided token)
    if (request) {
      const authHeader = request.headers.get('authorization')
      console.log('Authorization header:', authHeader ? 'present' : 'missing');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const supabase = await createServerSupabaseClient()
        
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (!error && user) {
          console.log('Got user from Bearer token:', user.email);
          return {
            user,
            access_token: token,
            expires_at: undefined // We don't have this from the token
          }
        }
        console.log('Bearer token failed:', error);
      }
    }

    // Fallback to cookies
    console.log('Trying cookie-based session...');
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('Cookie session result:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userEmail: session?.user?.email,
      error: error?.message 
    });
    
    if (error) {
      console.log('Session error:', error);
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error getting session:', error);
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
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

// Type definitions for session and user data
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