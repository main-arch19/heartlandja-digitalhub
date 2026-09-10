import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Supabase access.
 *
 * The whole application is designed to run with NO Supabase project at all —
 * `hasSupabase()` is false, and the data layer falls back to seed files. That
 * is what makes the MVP demonstrable before a backend is provisioned.
 *
 * Nothing outside `src/lib/data`, `src/lib/auth` and `src/lib/analytics` should
 * import from this file.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Placeholder values in `.env.example` must not count as "configured". */
function isRealValue(value: string | undefined): value is string {
  if (!value) return false
  const v = value.trim()
  if (v.length === 0) return false
  return !/^(your|placeholder|changeme|todo|xxx)/i.test(v)
}

export function hasSupabase(): boolean {
  return isRealValue(url) && isRealValue(anonKey)
}

export function hasServiceRole(): boolean {
  return hasSupabase() && isRealValue(serviceKey)
}

/**
 * Request-scoped client carrying the user's session cookies. Respects RLS.
 * Use this for everything a signed-in user does.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!hasSupabase()) return null

  const cookieStore = await cookies()

  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh is handled in middleware instead.
        }
      },
    },
  })
}

/**
 * Anonymous client with no user session. For public reads in cached contexts
 * (sitemaps, static generation) where there is no request to read cookies from.
 */
export function getSupabaseAnonClient(): SupabaseClient | null {
  if (!hasSupabase()) return null
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Only for server-side work that genuinely cannot be done as the user:
 * inserting tracking events for anonymous visitors, and admin exports. Never
 * import this into anything that renders for a visitor.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  if (!hasServiceRole()) return null
  return createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
