import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TaskCreateSchema } from "@/lib/zod";
import { CacheService } from "@/lib/cache";
import {
  checkRateLimit,
  createRateLimitKey,
  logRateLimitHit,
  readLimiter,
  writeLimiter,
} from "@/lib/ratelimit";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();
  try {
    // Get user IP and rate limit
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    logger.apiRequest("GET", "/api/tasks", undefined, ip, userAgent);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.authFailure("Invalid or expired token", undefined, ip, userAgent);
      logger.apiResponse("GET", "/api/tasks", 401, Date.now() - startTime);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("User authenticated for tasks fetch", { userId: user.id });

    // Rate limiting for read operations
    const rateLimitKey = createRateLimitKey(user.id, ip);
    const rateLimitResult = await checkRateLimit(readLimiter, rateLimitKey);

    if (!rateLimitResult.success) {
      logRateLimitHit(
        rateLimitKey,
        "/api/tasks",
        "GET",
        headersList.get("user-agent") || undefined
      );
      logger.rateLimitHit(rateLimitKey, rateLimitResult.limit, "60s", ip);
      logger.apiResponse(
        "GET",
        "/api/tasks",
        429,
        Date.now() - startTime,
        user.id
      );

      return NextResponse.json(
        { error: "Too many requests", retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.getTime().toString(),
          },
        }
      );
    }

    // Try to get from cache first
    const cacheKey = CacheService.getUserTasksKey(user.id);
    const cachedTasks = await CacheService.get(cacheKey);

    if (cachedTasks) {
      logger.cacheHit(cacheKey, user.id);
      logger.apiResponse(
        "GET",
        "/api/tasks",
        200,
        Date.now() - startTime,
        user.id
      );
      return NextResponse.json(
        {
          data: cachedTasks,
          cached: true,
        },
        {
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-Cache": "HIT",
          },
        }
      );
    }

    // Fetch from database
    logger.cacheMiss(cacheKey, user.id);
    logger.dbQuery("SELECT", "tasks", user.id);

    const dbStartTime = Date.now();
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    const dbDuration = Date.now() - dbStartTime;

    if (error) {
      logger.dbError("SELECT", "tasks", error.message, user.id);
      logger.apiResponse(
        "GET",
        "/api/tasks",
        500,
        Date.now() - startTime,
        user.id
      );
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    logger.dbQuery("SELECT", "tasks", user.id, dbDuration);
    logger.info("Tasks fetched successfully", {
      count: tasks?.length || 0,
      userId: user.id,
    });

    // Cache the results
    await CacheService.set(cacheKey, tasks);
    logger.cacheSet(cacheKey, 60, user.id);

    logger.apiResponse(
      "GET",
      "/api/tasks",
      200,
      Date.now() - startTime,
      user.id
    );
    return NextResponse.json(
      {
        data: tasks,
        cached: false,
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    logger.error("API Error in GET /api/tasks", {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    logger.apiResponse("GET", "/api/tasks", 500, Date.now() - startTime);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Get user IP and rate limit
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    logger.apiRequest("POST", "/api/tasks", undefined, ip, userAgent);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.authFailure("Invalid or expired token", undefined, ip, userAgent);
      logger.apiResponse("POST", "/api/tasks", 401, Date.now() - startTime);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("User authenticated for task creation", { userId: user.id });

    // Rate limiting for write operations (stricter)
    const rateLimitKey = createRateLimitKey(user.id, ip);
    const rateLimitResult = await checkRateLimit(writeLimiter, rateLimitKey);

    if (!rateLimitResult.success) {
      logRateLimitHit(
        rateLimitKey,
        "/api/tasks",
        "POST",
        headersList.get("user-agent") || undefined
      );
      logger.rateLimitHit(rateLimitKey, rateLimitResult.limit, "60s", ip);
      logger.apiResponse(
        "POST",
        "/api/tasks",
        429,
        Date.now() - startTime,
        user.id
      );

      return NextResponse.json(
        { error: "Too many requests", retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.getTime().toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    logger.debug("Task creation request body", { body }, { userId: user.id });

    const validationResult = TaskCreateSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Task creation validation failed", {
        errors: validationResult.error.issues,
        userId: user.id,
      });
      logger.apiResponse(
        "POST",
        "/api/tasks",
        400,
        Date.now() - startTime,
        user.id
      );
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const taskData = {
      ...validationResult.data,
      user_id: user.id,
    };

    // Insert into database
    logger.dbQuery("INSERT", "tasks", user.id);
    const dbStartTime = Date.now();

    const { data: task, error } = await supabase
      .from("tasks")
      .insert([taskData])
      .select()
      .single();

    const dbDuration = Date.now() - dbStartTime;

    if (error) {
      logger.dbError("INSERT", "tasks", error.message, user.id);
      logger.apiResponse(
        "POST",
        "/api/tasks",
        500,
        Date.now() - startTime,
        user.id
      );
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }

    logger.dbQuery("INSERT", "tasks", user.id, dbDuration);
    logger.info("Task created successfully", {
      taskId: task.id,
      title: task.title,
      userId: user.id,
    });

    // Invalidate user cache
    await CacheService.invalidateUserCache(user.id);
    logger.cacheInvalidation(`tasks:${user.id}`, "task_created", user.id);

    logger.apiResponse(
      "POST",
      "/api/tasks",
      201,
      Date.now() - startTime,
      user.id
    );
    return NextResponse.json(
      {
        data: task,
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      }
    );
  } catch (error) {
    logger.error("API Error in POST /api/tasks", {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    logger.apiResponse("POST", "/api/tasks", 500, Date.now() - startTime);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
