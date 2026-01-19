import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip auth check for login page
  if (pathname === "/admin/login") {
    // Create new request headers with login page flag
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-is-login-page", "true");
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return response;
  }
  
  // Check authentication for all other admin routes
  const adminAuthCookie = request.cookies.get("admin-auth");
  const isAuthenticated = adminAuthCookie?.value === "authenticated";
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
