import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST() {
  try {
    // This is a demo endpoint to manually trigger the archiving process
    // In production, this would be called by Supabase cron job
    
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    // Simple authentication check (in production, use proper auth)
    const isDemo = process.env.NODE_ENV === 'development'
    if (!isDemo && !authHeader?.includes('Bearer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for admin operations
    const supabase = createServiceClient()

    // Calculate cutoff date (30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Archive tasks that are 'done' and older than 30 days
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'done')
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .select('id, title, user_id, updated_at')

    if (error) {
      console.error('Error archiving tasks:', error)
      return NextResponse.json(
        { error: 'Failed to archive tasks', details: error.message },
        { status: 500 }
      )
    }

    const result = {
      success: true,
      archived_count: data?.length || 0,
      archived_tasks: data || [],
      executed_at: new Date().toISOString(),
      cutoff_date: thirtyDaysAgo.toISOString(),
      message: `Successfully archived ${data?.length || 0} tasks older than 30 days`
    }

    console.log('Manual task archiving completed:', result)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in archive-tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to check archivable tasks without archiving them
export async function GET() {
  try {
    const supabase = createServiceClient()

    // Calculate cutoff date (30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find tasks that would be archived
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, user_id, updated_at')
      .eq('status', 'done')
      .lt('updated_at', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('Error checking archivable tasks:', error)
      return NextResponse.json(
        { error: 'Failed to check archivable tasks', details: error.message },
        { status: 500 }
      )
    }

    const result = {
      archivable_count: data?.length || 0,
      archivable_tasks: data || [],
      cutoff_date: thirtyDaysAgo.toISOString(),
      message: `Found ${data?.length || 0} tasks that can be archived`
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in checking archivable tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
