import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/about",
  "/blog",
  "/docs",
  "/api",
  "/privacy",
  "/terms",
  "/changelog",
  "/roadmap",
  "/status",
];

// Auth routes (redirect to dashboard if already authenticated)
const authRoutes = ["/signin", "/signup", "/reset-password"];

// Protected routes (require authentication)
const protectedRoutes = ["/dashboard", "/explore", "/projects", "/settings"];

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route.endsWith("*")) {
      return path.startsWith(route.slice(0, -1));
    }
    return path === route || path.startsWith(`${route}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except auth API)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const isPublicRoute = matchesRoute(pathname, publicRoutes);
    const isAuthRoute = matchesRoute(pathname, authRoutes);
    const isProtectedRoute = matchesRoute(pathname, protectedRoutes);

    // Log authentication attempts (for security monitoring)
    if (process.env.NODE_ENV === "development") {
      console.log(`[MIDDLEWARE] ${pathname} - Session: ${session ? "✓" : "✗"}`);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/explore", request.url));
    }

    // Redirect unauthenticated users to signin
    if (isProtectedRoute && !session) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Add security headers
    const response = NextResponse.next();

    // Security headers (OWASP recommendations)
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );

    // CSP header (adjust as needed)
    if (process.env.NODE_ENV === "production") {
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
      );
    }

    return response;
  } catch (error) {
    console.error("[MIDDLEWARE] Error:", error);

    // On error, allow public routes but redirect protected routes to signin
    if (matchesRoute(pathname, protectedRoutes)) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
