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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, AlertCircle, UserPlus, LogIn } from 'lucide-react';

export function EnhancedSignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('signin'); // Default to Sign In for returning users
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Always redirect to dashboard after successful login
      router.push('/en/settlement');
    }
  }, [session, status, router]);

  const handleOAuthSignIn = async (provider: 'discord') => {
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

  const handleEmailAuth = async (e: React.FormEvent, mode: 'signin' | 'signup') => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
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
            Connect your account to manage your settlement
          </p>
        </div>

        {/* Main Card with Tabs */}
        <Card className="shadow-lg">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
              setError(''); // Clear errors when switching tabs
              setEmail(''); // Clear form when switching
              setPassword('');
            }} 
            className="w-full"
          >
            {/* Tab Headers */}
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <CardDescription className="text-center">
                {activeTab === 'signin' 
                  ? 'Welcome back! Sign in to access your settlement dashboard and data.'
                  : 'New to BitCraft.guide? Create an account to start managing your settlement.'
                }
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

              {/* OAuth Buttons - Same for both tabs */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleOAuthSignIn('discord')}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-none transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Discord
                  </Button>

                  <Button
                    variant="outline"
                    disabled
                    className="w-full opacity-60 cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none">
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

              {/* Tab-specific Email Forms */}
              <TabsContent value="signin" className="space-y-0 mt-0">
                <form onSubmit={(e) => handleEmailAuth(e, 'signin')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
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
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In to Your Account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-0 mt-0">
                <form onSubmit={(e) => handleEmailAuth(e, 'signup')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Account
                  </Button>
                </form>
              </TabsContent>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
                By {activeTab === 'signin' ? 'signing in' : 'creating an account'}, you agree to our{' '}
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
          </Tabs>
        </Card>
      </div>
    </div>
  );
}