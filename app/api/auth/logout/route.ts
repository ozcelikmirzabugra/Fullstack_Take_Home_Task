import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  // Get the origin from the request to construct absolute URLs
  const origin = request.nextUrl.origin
  
  if (error) {
    console.error('Error signing out:', error.message)
    return NextResponse.redirect(`${origin}/dashboard?error=Could not sign out`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
