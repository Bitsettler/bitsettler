import { createServerSupabaseClient } from '@/lib/supabase-server-auth'
import { NextRequest, NextResponse } from 'next/server'
import { extractDiscordAvatarData } from '@/lib/discord-avatar'

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
        
        // Extract Discord avatar data if this is a Discord OAuth login
        if (data.user && data.user.app_metadata?.provider === 'discord') {
          const discordAvatarData = extractDiscordAvatarData(data.user);
          
          if (discordAvatarData) {
            try {
              // Update the user's settlement member record with Discord avatar data
              // This will be updated when they claim a character, but we can store it now too
              const supabase = await createServerSupabaseClient();
              
              // Try to find an existing member record for this auth user
              const { data: existingMember } = await supabase
                .from('settlement_members')
                .select('id')
                .eq('auth_user_id', data.user.id)
                .single();
              
              if (existingMember) {
                // Update existing member with Discord avatar data
                const { error: updateError } = await supabase
                  .from('settlement_members')
                  .update(discordAvatarData)
                  .eq('auth_user_id', data.user.id);
                
                if (updateError) {
                  console.error('❌ Failed to update Discord avatar data:', updateError);
                } else {
                  console.log('✅ Updated Discord avatar data for existing member');
                }
              }
              
              console.log('✅ Discord avatar data extracted:', {
                userId: discordAvatarData.discord_user_id,
                username: discordAvatarData.discord_username,
                hasAvatar: !!discordAvatarData.discord_avatar_hash
              });
            } catch (avatarError) {
              console.error('❌ Error processing Discord avatar data:', avatarError);
              // Don't fail the auth flow if avatar processing fails
            }
          }
        }
        
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