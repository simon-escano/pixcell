import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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

  const unprotectedPaths = ["/login", "/signup"];
  const user = await getUser(request, response);
  const isUnprotectedPath = unprotectedPaths.some((up) => path.startsWith(up));

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

async function getUser(request: NextRequest, response: NextResponse) {
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const user = (await supabaseClient.auth.getUser()).data.user;
  return user;
}
