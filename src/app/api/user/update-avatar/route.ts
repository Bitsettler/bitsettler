import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client'
import { getSupabaseSession } from '@/lib/supabase-server-auth'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getSupabaseSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { avatar_url } = await request.json()

    if (!avatar_url || typeof avatar_url !== 'string') {
      return NextResponse.json({ error: 'avatar_url is required' }, { status: 400 })
    }

    // Get server client
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Update avatar for the user's settlement member record
    console.log('Attempting to update avatar for user:', session.user.id, 'with URL:', avatar_url)
    
    const { data, error } = await supabase
      .from('settlement_members')
      .update({ avatar_url })
      .eq('supabase_user_id', session.user.id)
      .select()

    if (error) {
      console.error('Error updating member avatar:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // If the column doesn't exist, return success but log it
      if (error.message?.includes('column "avatar_url" of relation "settlement_members" does not exist')) {
        console.warn('Avatar column does not exist in database yet, skipping update')
        return NextResponse.json({ 
          success: true, 
          data: { updated: 0, skipped: 'column_missing' }
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update avatar',
        details: error.message 
      }, { status: 500 })
    }

    console.log('Avatar update successful, affected rows:', data?.length || 0)

    return NextResponse.json({ 
      success: true, 
      data: { updated: data?.length || 0 }
    })

  } catch (error) {
    console.error('Error in update-avatar API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
