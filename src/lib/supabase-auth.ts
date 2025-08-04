'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/spacetime-db-new/shared/supabase-client'

// Create Supabase client for auth with SSR cookie support
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)

// Auth helper functions
export const auth = {
  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  },

  // Sign in with email
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign up with email
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Sign in with OAuth (Google, Discord, etc.)
  async signInWithProvider(provider: 'google' | 'discord' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    return { error }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: { user?: { id: string; email?: string; name?: string } } | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Types for auth
export type AuthUser = {
  id: string
  email?: string
  user_metadata: {
    name?: string
    avatar_url?: string
    preferred_username?: string
  }
}

export type AuthSession = {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at?: number
}

// Server-side auth helpers
export const serverAuth = {
  // Create server client for API routes
  createServerClient() {
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
  },

  // Get session from request headers
  async getSessionFromRequest(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const supabase = this.createServerClient()
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    return {
      user,
      access_token: token
    }
  }
}