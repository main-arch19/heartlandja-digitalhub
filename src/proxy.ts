import { NextResponse, type NextRequest } from 'next/server'

import { DEV_ROLE_COOKIE } from '@/lib/auth/constants'

/**
 * Route protection for /admin and /business.
 *
 * This is Next 16's `proxy` convention, which replaced `middleware`.
 *
 * It runs on the Edge runtime, where the Node `crypto` and Supabase server
 * helpers used by `lib/auth` are not available. So this is a coarse gate: it
 * checks only that *some* credential is present, and redirects anonymous
 * visitors before they reach the page.
 *
 * The real authorisation — which role, which business — happens in each page
 * via `requireRole`, and is enforced again by RLS in the database. This layer
 * exists to avoid rendering a protected shell to a signed-out visitor, not to
 * be the security boundary.
 */

const PROTECTED = ['/admin', '/business']

/** Supabase's SSR client stores its session in cookies prefixed `sb-`. */
function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The CSV export route does its own authorisation and returns 403 rather
  // than redirecting, so a download never turns into an HTML login page.
  if (pathname.startsWith('/business/report.csv')) return NextResponse.next()

  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!isProtected) return NextResponse.next()

  const signedIn =
    hasSupabaseSession(request) || Boolean(request.cookies.get(DEV_ROLE_COOKIE))

  if (!signedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/business/:path*'],
}
