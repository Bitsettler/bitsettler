'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-auth'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, MessageCircle, Github, Shield, Zap, AlertCircle } from 'lucide-react'

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Welcome to BitCraft.guide
            </h1>
            <p className="text-lg text-muted-foreground mt-3">
              Sign in to access settlement management features
            </p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl text-center font-semibold">
              {authView === 'sign_in' && 'Sign In'}
              {authView === 'sign_up' && 'Create Account'} 
              {authView === 'magic_link' && 'Magic Link'}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {authView === 'sign_in' && 'Welcome back! Choose your preferred sign-in method'}
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
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
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
                className="w-full h-12 text-base font-medium hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-5 w-5 text-red-500" />
                )}
                Continue with Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('discord')}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-950 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <MessageCircle className="mr-2 h-5 w-5 text-indigo-500" />
                )}
                Continue with Discord
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-950 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Github className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
                )}
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Forms */}
            {authView === 'magic_link' ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="h-11"
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-medium">
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
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-11"
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-medium">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {authView === 'sign_in' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
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
                    className="text-sm font-medium"
                  >
                    Don't have an account? <span className="text-primary ml-1">Sign up</span>
                  </Button>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthView('magic_link')}
                      className="text-sm font-medium"
                    >
                      Prefer passwordless? <span className="text-primary ml-1">Use magic link</span>
                    </Button>
                  </div>
                </>
              ) : authView === 'sign_up' ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAuthView('sign_in')}
                    className="text-sm font-medium"
                  >
                    Already have an account? <span className="text-primary ml-1">Sign in</span>
                  </Button>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthView('magic_link')}
                      className="text-sm font-medium"
                    >
                      Prefer passwordless? <span className="text-primary ml-1">Use magic link</span>
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAuthView('sign_in')}
                  className="text-sm font-medium"
                >
                  Back to <span className="text-primary ml-1">traditional sign-in</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline font-medium">terms of service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline font-medium">privacy policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}