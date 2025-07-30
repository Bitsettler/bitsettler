'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase-auth'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogIn, Mail, MessageCircle, Github } from 'lucide-react'

export default function SignInPage() {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in')
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if already signed in
    if (session && !loading) {
      router.push('/en/settlement')
      router.refresh()
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto rounded-full bg-muted animate-pulse mb-4" />
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to BitCraft.guide</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to access settlement management features
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {authView === 'sign_in' ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {authView === 'sign_in' 
                ? 'Choose your preferred sign-in method'
                : 'Create your account to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick OAuth Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={() => supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/auth/callback` }
                })}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                onClick={() => supabase.auth.signInWithOAuth({
                  provider: 'discord',
                  options: { redirectTo: `${window.location.origin}/auth/callback` }
                })}
                className="w-full"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Continue with Discord
              </Button>

              <Button
                variant="outline"
                onClick={() => supabase.auth.signInWithOAuth({
                  provider: 'github',
                  options: { redirectTo: `${window.location.origin}/auth/callback` }
                })}
                className="w-full"
              >
                <Github className="mr-2 h-4 w-4" />
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

            {/* Supabase Auth UI for email/password */}
            <Auth
              supabaseClient={supabase}
              view={authView}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                    }
                  }
                },
                className: {
                  container: 'space-y-4',
                  button: 'w-full px-4 py-2 rounded-md font-medium transition-colors',
                  input: 'w-full px-3 py-2 border rounded-md',
                }
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/auth/callback`}
              onlyThirdPartyProviders={false}
              magicLink={true}
            />

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in')}
                className="text-sm"
              >
                {authView === 'sign_in' 
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}