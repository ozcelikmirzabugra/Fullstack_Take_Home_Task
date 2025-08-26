import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

export interface RequestLoggerOptions {
  skipPaths?: string[];
  logBody?: boolean;
  logHeaders?: boolean;
}

export function withRequestLogger(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  options: RequestLoggerOptions = {}
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const { method, url, headers } = req;
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = headers.get("user-agent") || "unknown";

    // Skip logging for certain paths if specified
    if (options.skipPaths?.some((path) => url.includes(path))) {
      return handler(req, ...args);
    }

    // Extract user ID from headers or token if available
    let userId: string | undefined;
    try {
      const authHeader = headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        // In a real app, you'd decode the JWT to get user ID
        userId = "extracted-from-jwt";
      }
    } catch (_error) {
      // Ignore auth extraction errors
    }

    // Log the incoming request
    logger.apiRequest(method, url, userId, ip, userAgent, requestId);

    if (options.logBody && req.body) {
      try {
        const body = await req.text();
        logger.debug(
          "Request body",
          { body: JSON.parse(body) },
          { requestId, userId }
        );
      } catch (error) {
        logger.debug(
          "Failed to parse request body",
          { error: String(error) },
          { requestId }
        );
      }
    }

    if (options.logHeaders) {
      const headerObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        // Don't log sensitive headers
        if (
          !["authorization", "cookie", "x-api-key"].includes(key.toLowerCase())
        ) {
          headerObj[key] = value;
        }
      });
      logger.debug(
        "Request headers",
        { headers: headerObj },
        { requestId, userId }
      );
    }

    try {
      // Execute the actual handler
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;

      // Log the response
      logger.apiResponse(
        method,
        url,
        response.status,
        duration,
        userId,
        requestId
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log the error
      logger.error(
        "API handler error",
        {
          method,
          url,
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: `${duration}ms`,
        },
        { requestId, userId, ip, userAgent }
      );

      // Re-throw the error
      throw error;
    }
  };
}

// Helper function to extract user ID from Supabase session
export async function extractUserIdFromRequest(
  req: NextRequest
): Promise<string | undefined> {
  try {
    // This would typically involve verifying a JWT token
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // In practice, you'd validate the JWT and extract user ID
      return "user-from-jwt";
    }

    // Or from cookies if using cookie-based auth
    const sessionCookie = req.cookies.get("sb-access-token");
    if (sessionCookie) {
      // Validate and extract user ID from session
      return "user-from-cookie";
    }

    return undefined;
  } catch (error) {
    logger.error("Failed to extract user ID from request", {
      error: String(error),
    });
    return undefined;
  }
}
