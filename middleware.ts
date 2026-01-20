import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip auth check for login page and NextAuth API routes
  if (pathname === "/admin/login" || pathname.startsWith("/api/auth")) {
    // Create new request headers with login page flag
    const requestHeaders = new Headers(request.headers);
    if (pathname === "/admin/login") {
      requestHeaders.set("x-is-login-page", "true");
    }
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Add security headers
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    
    return response;
  }
  
  // Check for NextAuth session cookie (works in Edge Runtime)
  // NextAuth v5 uses "authjs.session-token" cookie name
  const sessionToken = request.cookies.get("authjs.session-token") || 
                       request.cookies.get("__Secure-authjs.session-token");
  
  if (!sessionToken) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Add security headers for authenticated admin pages
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
