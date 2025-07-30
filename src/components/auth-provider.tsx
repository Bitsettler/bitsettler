'use client'

import { AuthProvider as SupabaseAuthProvider } from '@/hooks/use-auth'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
}