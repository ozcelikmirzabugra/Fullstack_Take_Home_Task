export function generateNonce(): string {
  // Use Web Crypto API instead of Node.js crypto for Edge runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
  }
  // Fallback for environments where crypto is not available
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function getCSPHeader(nonce: string): Promise<string> {
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ];

  return cspDirectives.join('; ');
}

export function getSecurityHeaders(nonce: string): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: https:`,
      `connect-src 'self' https:`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
    ].join('; '),
    
    // Other security headers
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Handle null origin (file:// URLs, form submissions, etc.)
  if (origin === 'null') {
    headers['Access-Control-Allow-Origin'] = 'null';
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  // Check if origin is allowed
  else if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}
