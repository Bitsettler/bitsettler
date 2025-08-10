import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client'
import { getAuthUser } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const { data, error } = await supabase
      .from('settlement_members')
      .update({ avatar_url })
      .eq('auth_user_id', user.id)
      .select()

    if (error) {
      console.error('Error updating member avatar:', error)
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: { updated: data?.length || 0 }
    })

  } catch (error) {
    console.error('Error in update-avatar API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
