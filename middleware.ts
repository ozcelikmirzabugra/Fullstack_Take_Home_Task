import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";
import { getCORSHeaders, getSecurityHeaders, generateNonce } from "@/lib/csp";

export async function middleware(request: NextRequest) {
  console.log("🚀 Middleware called for:", request.url, request.method);

  // Log ALL requests for debugging
  console.log("🚀 Full request details:", {
    url: request.url,
    method: request.method,
    nextUrl: request.nextUrl.pathname,
    headers: Object.fromEntries(request.headers.entries()),
  });

  // Temporarily bypass middleware for debugging
  if (request.url.includes("/signup") || request.url.includes("/login")) {
    console.log("🚀 Bypassing middleware for auth pages");
    return NextResponse.next();
  }

  const { supabase, response } = createClient(request);

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  const origin = request.headers.get("origin");

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const corsHeaders = getCORSHeaders(origin || undefined);
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Generate nonce for CSP
  const nonce = generateNonce();
  response.headers.set("x-nonce", nonce);

  // Apply security headers
  const securityHeaders = getSecurityHeaders(nonce);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply CORS headers for actual requests
  const corsHeaders = getCORSHeaders(origin || undefined);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
