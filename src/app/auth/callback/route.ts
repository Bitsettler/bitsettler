import { createServerSupabaseClient } from '@/lib/supabase-server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/en/settlement'

  if (code) {
    const supabase = createServerSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.session) {
        console.log('✅ Auth callback successful for user:', data.user?.email)
        
        // Redirect to settlement area after successful auth
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('❌ Auth callback error:', error)
        return NextResponse.redirect(`${origin}/en/auth/signin?error=auth_callback_error`)
      }
    } catch (error) {
      console.error('❌ Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/en/auth/signin?error=auth_callback_error`)
    }
  }

  // No code provided, redirect to sign in
  return NextResponse.redirect(`${origin}/en/auth/signin?error=no_code_provided`)
}