'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, type AuthUser, type AuthSession } from '@/lib/supabase-auth'
import { api } from '@/lib/api-client'

// Function to update member avatar in database
async function updateMemberAvatar(userId: string, avatarUrl: string) {
  try {
    const response = await api.post('/api/user/update-avatar', { avatar_url: avatarUrl })
    if (!response.success) {
      throw new Error(response.error || 'Failed to update avatar')
    }
    return response
  } catch (error) {
    console.error('Error updating member avatar:', error)
    throw error
  }
}

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signIn: typeof auth.signInWithEmail
  signInWithProvider: typeof auth.signInWithProvider
  signUp: typeof auth.signUp
  signOut: typeof auth.signOut
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    auth.getSession().then((session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email)
          // Store Discord avatar if available
          const avatarUrl = session.user.user_metadata?.avatar_url
          if (avatarUrl) {
            console.log('User has Discord avatar:', avatarUrl)
            // Update settlement member with avatar URL
            updateMemberAvatar(session.user.id, avatarUrl).catch(err => {
              console.error('Failed to update member avatar:', err)
            })
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    // The auth.signOut function now handles everything including page redirect
    return await auth.signOut()
  }

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signIn: auth.signInWithEmail,
    signInWithProvider: auth.signInWithProvider,
    signUp: auth.signUp,
    signOut: handleSignOut
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Compatibility hook for session access
export function useSession() {
  const { user, session, loading } = useAuth()
  
  return {
    data: session ? {
      user: {
        id: user?.id,
        name: user?.user_metadata?.name || user?.user_metadata?.preferred_username || user?.email?.split('@')[0],
        email: user?.email,
        image: user?.user_metadata?.avatar_url
      },
      access_token: session.access_token
    } : null,
    status: loading ? 'loading' : (session ? 'authenticated' : 'unauthenticated')
  }
}