import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TaskUpdateSchema } from '@/lib/zod'
import { CacheService } from '@/lib/cache'
import { checkRateLimit, createRateLimitKey, logRateLimitHit, readLimiter, writeLimiter } from '@/lib/ratelimit'
import { headers } from 'next/headers'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Get user IP and rate limit
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown'

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for read operations
    const rateLimitKey = createRateLimitKey(user.id, ip)
    const rateLimitResult = await checkRateLimit(readLimiter, rateLimitKey)

    if (!rateLimitResult.success) {
      logRateLimitHit(rateLimitKey, `/api/tasks/${id}`, 'GET', headersList.get('user-agent') || undefined)
      
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      )
    }

    // Try to get from cache first
    const cacheKey = CacheService.getUserTaskKey(user.id, id)
    const cachedTask = await CacheService.get(cacheKey)

    if (cachedTask) {
      return NextResponse.json({ 
        data: cachedTask, 
        cached: true 
      }, {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-Cache': 'HIT'
        }
      })
    }

    // Fetch from database - RLS will ensure user can only access their own tasks
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
    }

    // Cache the result
    await CacheService.set(cacheKey, task)

    return NextResponse.json({ 
      data: task, 
      cached: false 
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Get user IP and rate limit
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown'

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for write operations
    const rateLimitKey = createRateLimitKey(user.id, ip)
    const rateLimitResult = await checkRateLimit(writeLimiter, rateLimitKey)

    if (!rateLimitResult.success) {
      logRateLimitHit(rateLimitKey, `/api/tasks/${id}`, 'PUT', headersList.get('user-agent') || undefined)
      
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = TaskUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    // Update in database - RLS will ensure user can only update their own tasks
    const { data: task, error } = await supabase
      .from('tasks')
      .update(validationResult.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Invalidate user cache
    await CacheService.invalidateUserCache(user.id)

    return NextResponse.json({ 
      data: task 
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Get user IP and rate limit
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown'

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for write operations
    const rateLimitKey = createRateLimitKey(user.id, ip)
    const rateLimitResult = await checkRateLimit(writeLimiter, rateLimitKey)

    if (!rateLimitResult.success) {
      logRateLimitHit(rateLimitKey, `/api/tasks/${id}`, 'DELETE', headersList.get('user-agent') || undefined)
      
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          }
        }
      )
    }

    // Delete from database - RLS will ensure user can only delete their own tasks
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    // Invalidate user cache
    await CacheService.invalidateUserCache(user.id)

    return NextResponse.json({ 
      message: 'Task deleted successfully' 
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
