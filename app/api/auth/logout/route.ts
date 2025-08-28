import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  // Get the origin from the request to construct absolute URLs
  // Handle cases where origin might be null or undefined
  const origin = request.nextUrl.origin || 
                 request.headers.get('host')?.startsWith('localhost') ? 'http://localhost:3000' : 
                 `https://${request.headers.get('host')}` || 'http://localhost:3000'
  
  if (error) {
    console.error('Error signing out:', error.message)
    return NextResponse.redirect(`${origin}/dashboard?error=Could not sign out`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
