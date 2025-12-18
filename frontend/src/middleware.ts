import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Early return for static assets and API routes (handled by matcher, but double-check)
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Handle sample redirects
  if (/^\/samples\/[^\/]+$/.test(path)) {
    return NextResponse.redirect(new URL(`${path}/view`, request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Define unprotected paths once
  const unprotectedPaths = ["/login", "/signup", "/reset-password", "/reports/view"];
  const isUnprotectedPath = unprotectedPaths.some((up) => path.startsWith(up));

  // For unprotected paths, skip auth check to improve performance
  if (isUnprotectedPath) {
    // If already authenticated and trying to access login, redirect
    const supabase = createMiddlewareClient({ req: request, res: response });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && (path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/reset-password"))) {
      return NextResponse.redirect(new URL("/organizations", request.url));
    }
    
    return response;
  }

  // For protected paths, check authentication
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { user } } = await supabase.auth.getUser();

  // If the user is authenticated and hits the root "/", send them straight to /organizations
  if (user && path === "/") {
    return NextResponse.redirect(new URL("/organizations", request.url));
  }

  // If not authenticated and trying to access protected path, redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
