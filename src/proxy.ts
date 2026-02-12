import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Intercept auth code at root — Supabase PKCE sends ?code= to the site URL
  const { pathname, searchParams } = request.nextUrl
  const code = searchParams.get("code")
  if (pathname === "/" && code) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = "/api/auth/callback"
    callbackUrl.searchParams.set("code", code)
    callbackUrl.searchParams.set("next", "/reset-password")
    return NextResponse.redirect(callbackUrl)
  }

  // Homepage without code — no auth check needed, pass through
  if (pathname === "/") return supabaseResponse

  // Refresh session — MUST call getUser() to validate the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /admin/* — redirect to /login if not authenticated
  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // Protect /reset-password — redirect to /login if no recovery session
  if (pathname === "/reset-password" && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // Redirect /login to /admin if already authenticated
  if (pathname === "/login" && user) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = "/admin"
    return NextResponse.redirect(adminUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/", "/admin/:path*", "/login", "/reset-password"],
}
