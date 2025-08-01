'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

export function EnhancedSignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up for new users
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Always redirect to dashboard after successful login
      router.push('/en/settlement');
    }
  }, [session, status, router]);

  const handleOAuthSignIn = async (provider: 'google' | 'discord') => {
    try {
      setError('');
      await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to sign in with ' + provider);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
        setError('Check your email for a confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to BitCraft.guide
          </h1>
          <p className="text-muted-foreground">
            Sign in to manage your settlement
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              Because our system tracks progress and growth, we need you to have an account to track that. Please sign in, or sign up.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant={error.includes('Check your email') ? 'default' : 'destructive'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-4">
              {/* Current OAuth Providers */}
              <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('google')}
                className="w-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('discord')}
                className="w-full hover:bg-[#5865F2]/5 hover:border-[#5865F2]/20 transition-colors group"
              >
                <svg className="w-4 h-4 mr-2 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="group-hover:text-[#5865F2] transition-colors">Discord</span>
              </Button>
              

              <Button
                variant="outline"
                disabled
                className="w-full opacity-60 cursor-not-allowed hover:bg-[#1b2838]/5 hover:border-[#1b2838]/20 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.749-.962 3.749s-.18.717-.542.717c-.361 0-.542-.717-.542-.717s-.782-3.032-.962-3.749c-.18-.717-.18-1.434.361-1.434.542 0 .542.717.542.717s.782 3.032.962 3.749c.18.717.542.717.542.717s.361 0 .542-.717c.18-.717.962-3.749.962-3.749s0-.717.361-.717c.361 0 .361 1.434.18 1.434zm-5.562 7.677c-3.25 0-5.887-2.637-5.887-5.887S8.75 4.064 12 4.064s5.887 2.637 5.887 5.887-2.637 5.887-5.887 5.887z" fill="#1b2838"/>
                  <circle cx="12" cy="12" r="3" fill="#66c0f4"/>
                  <circle cx="10" cy="10" r="1" fill="#1b2838"/>
                  <circle cx="14" cy="10" r="1" fill="#1b2838"/>
                  <path d="M10 13.5c0 1.1.9 2 2 2s2-.9 2-2" stroke="#1b2838" strokeWidth="0.5" fill="none"/>
                </svg>
                <span className="mr-2">Steam</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </Button>
              </div>
              
              {/* Coming Soon Provider */}
              <Button
                variant="outline"
                disabled
                className="w-full opacity-60 cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                  {/* BitCraft crystal/gem logo - blue geometric design */}
                  <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#2563eb" stroke="#1e40af" strokeWidth="0.5"/>
                  <polygon points="12,2 20,7 16,10 12,7" fill="#3b82f6"/>
                  <polygon points="4,7 12,2 8,7 4,10" fill="#1e40af"/>
                  <polygon points="12,7 16,10 20,17 12,12" fill="#60a5fa"/>
                  <polygon points="4,10 8,7 12,12 4,17" fill="#1d4ed8"/>
                  <polygon points="8,7 12,7 12,12 8,12" fill="#2563eb"/>
                  <polygon points="12,12 16,10 16,17 12,17" fill="#3b82f6"/>
                  <polygon points="8,12 12,12 12,22 4,17" fill="#1e40af"/>
                  <polygon points="12,12 12,22 20,17 16,17" fill="#2563eb"/>
                </svg>
                <span className="mr-2">BitCraft</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
              By signing in, you agree to our{' '}
              <a href="#" className="underline hover:text-primary">
                terms of service
              </a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-primary">
                privacy policy
              </a>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}