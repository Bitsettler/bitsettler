'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase-auth'

export default function SignInPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (session && !loading) {
      router.push('/en/settlement')
    }
  }, [session, loading, router])

  const handleOAuthSignIn = async (provider: 'google' | 'discord' | 'github') => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (session) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center', space: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome to BitCraft.guide</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Sign in to access settlement management features</p>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Sign In</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Choose your preferred sign-in method</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <button 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                backgroundColor: 'white',
                marginBottom: '0.75rem',
                cursor: 'pointer'
              }}
              onClick={() => handleOAuthSignIn('google')}
            >
              Continue with Google
            </button>
            
            <button 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                backgroundColor: 'white',
                marginBottom: '0.75rem',
                cursor: 'pointer'
              }}
              onClick={() => handleOAuthSignIn('discord')}
            >
              Continue with Discord
            </button>
            
            <button 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              onClick={() => handleOAuthSignIn('github')}
            >
              Continue with GitHub
            </button>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}