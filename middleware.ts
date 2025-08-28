import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware called for:", request.url, request.method);

  // Log ALL requests for debugging
  console.log("🚀 Full request details:", {
    url: request.url,
    method: request.method,
    nextUrl: request.nextUrl.pathname,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      // Don't log sensitive headers
      cookie: request.headers.get('cookie') ? '[REDACTED]' : undefined,
    },
  });

  const { supabase, response } = createClient(request);

  // Get authenticated user - more secure than getSession()
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("🚀 Auth check:", { 
    hasUser: !!user, 
    userId: user?.id,
    authError: authError?.message,
    path: request.nextUrl.pathname,
    cookies: request.headers.get('cookie') ? 'present' : 'missing'
  });

  // Check if user is authenticated for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/tasks') ||
                          request.nextUrl.pathname.startsWith('/api/tasks');

  // Allow auth pages to pass through
  if (request.url.includes("/signup") || request.url.includes("/login")) {
    console.log("🚀 Allowing auth pages to pass through");
    return NextResponse.next();
  }

  if (isProtectedRoute && !user) {
    console.log("🚀 Redirecting unauthenticated user to login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
