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
          const cookie = cookieStore.get(name)
          console.log(`Cookie get: ${name} = ${cookie?.value ? 'EXISTS' : 'MISSING'}`);
          return cookie?.value
        },
        set(name: string, value: string, options: any) {
          console.log(`Cookie set: ${name}`);
          // For server components, we can't set cookies
        },
        remove(name: string, options: any) {
          console.log(`Cookie remove: ${name}`);
          // For server components, we can't remove cookies
        },
      },
    }
  )
}

// Get session for API routes - replacement for getServerSession
export async function getSupabaseSession(request?: NextRequest) {
  try {
    console.log('getSupabaseSession called');
    
    // First try to get from cookies (this works for browser requests to API routes)
    try {
      const supabase = createServerClientWithAuth()
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Cookie session result:', { hasSession: !!session, error, userId: session?.user?.id });
      
      if (!error && session?.user) {
        return session
      }
    } catch (cookieError) {
      console.warn('Could not read session from cookies:', cookieError)
    }

    // Try alternative approach: read cookies from request headers
    if (request) {
      try {
        const cookieHeader = request.headers.get('cookie')
        console.log('Request cookie header exists:', !!cookieHeader);
        
        if (cookieHeader) {
          // Parse cookies manually to find Supabase session
          const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(cookie => {
              const [name, ...rest] = cookie.split('=')
              return [name, rest.join('=')]
            })
          )
          
          // Look for Supabase access token cookie
          const accessTokenCookie = Object.keys(cookies).find(key => 
            key.includes('supabase-auth-token') || (key.includes('sb-') && key.includes('auth-token'))
          )
          
          console.log('Found Supabase cookies:', Object.keys(cookies).filter(k => k.includes('supabase') || k.includes('sb-')));
          
          if (accessTokenCookie) {
            const tokenData = JSON.parse(decodeURIComponent(cookies[accessTokenCookie]))
            if (tokenData.access_token) {
              const supabase = createServerSupabaseClient()
              const { data: { user }, error } = await supabase.auth.getUser(tokenData.access_token)
              
              if (!error && user) {
                return {
                  user,
                  access_token: tokenData.access_token,
                  expires_at: tokenData.expires_at
                }
              }
            }
          }
        }
      } catch (requestCookieError) {
        console.warn('Could not parse request cookies:', requestCookieError)
      }
    }

    // Fallback to authorization header (for direct API calls with tokens)
    if (request) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const supabase = createServerSupabaseClient()
        
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (!error && user) {
          return {
            user,
            access_token: token,
            expires_at: user.email_confirmed_at ? undefined : Date.now() + 3600000
          }
        }
      }
    }

    return null
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