'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-auth'
import { useAuth } from '@/hooks/use-auth'
import { Container } from '@/components/container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, MessageCircle, Github, LogIn, Zap, AlertCircle } from 'lucide-react'

export default function SignInPage() {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up' | 'magic_link'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if already signed in
    if (session && !loading) {
      router.push('/en/settlement')
      router.refresh()
    }
  }, [session, loading, router])

  const handleOAuthSignIn = async (provider: 'google' | 'discord' | 'github') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (authView === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Check your email for a confirmation link!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email for a magic link!')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (session) {
    return null // Will redirect
  }

  return (
    <Container>
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome to BitCraft.guide</h1>
            <p className="text-muted-foreground">
              Sign in to access settlement management features
            </p>
          </div>

          <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              {authView === 'sign_in' && 'Sign In'}
              {authView === 'sign_up' && 'Create Account'} 
              {authView === 'magic_link' && 'Magic Link'}
            </CardTitle>
            <CardDescription className="text-center">
              {authView === 'sign_in' && 'Choose your preferred sign-in method'}
              {authView === 'sign_up' && 'Create your account to start managing settlements'}
              {authView === 'magic_link' && 'Get a secure sign-in link sent to your email'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('discord')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="mr-2 h-4 w-4" />
                )}
                Continue with Discord
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Forms */}
            {authView === 'magic_link' ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {authView === 'sign_in' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {authView === 'sign_in' ? 'Sign in' : 'Create account'}
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Toggle between views */}
            <div className="space-y-2 text-center">
              {authView === 'sign_in' ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAuthView('sign_up')}
                    className="text-sm"
                  >
                    Don't have an account? Sign up
                  </Button>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthView('magic_link')}
                      className="text-sm"
                    >
                      Prefer passwordless? Use magic link
                    </Button>
                  </div>
                </>
              ) : authView === 'sign_up' ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAuthView('sign_in')}
                    className="text-sm"
                  >
                    Already have an account? Sign in
                  </Button>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthView('magic_link')}
                      className="text-sm"
                    >
                      Prefer passwordless? Use magic link
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAuthView('sign_in')}
                  className="text-sm"
                >
                  Back to traditional sign-in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#" className="hover:underline">terms of service</a>
            {' '}and{' '}
            <a href="#" className="hover:underline">privacy policy</a>.
          </p>
        </div>
      </div>
    </Container>
  )
}