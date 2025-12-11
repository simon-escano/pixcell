import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (/^\/samples\/[^\/]+$/.test(path)) {
    return NextResponse.redirect(new URL(`${path}/view`, request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { user } } = await supabase.auth.getUser();
  const unprotectedPaths = ["/login", "/signup", "/reset-password","/reports/view"];
  const isUnprotectedPath = unprotectedPaths.some((up) => path.startsWith(up));

  // If the user is authenticated and hits the root "/", send them straight to /organizations
  if (user && path === "/") {
    return NextResponse.redirect(new URL("/organizations", request.url));
  }

  if (user && isUnprotectedPath) {
    return NextResponse.redirect(new URL("/", request.url));
  } else if (!user && !isUnprotectedPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
