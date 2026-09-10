import 'server-only'

import { cookies } from 'next/headers'
import { forbidden, redirect } from 'next/navigation'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import type { UserRole } from '@/types/db'

import { DEV_BUSINESS_COOKIE, DEV_ROLE_COOKIE } from './constants'

export { DEV_BUSINESS_COOKIE, DEV_ROLE_COOKIE }

/**
 * Authentication.
 *
 * This is the ONLY file that knows whether auth is real or stubbed. Every call
 * site imports `getSession` / `requireRole` from here and never touches
 * Supabase auth directly, so switching to a live Supabase project is a change
 * inside this module and nowhere else.
 *
 * Stub mode is active whenever Supabase is not configured, or when
 * NEXT_PUBLIC_AUTH_MODE=stub. It reads a role from a dev-only cookie set by
 * /dev/login, which itself only mounts outside production.
 */

export interface Session {
  userId: string
  email: string | null
  fullName: string | null
  role: UserRole
  /**
   * For business_owner sessions: the listing they own. In stub mode this is
   * seeded from a cookie so the owner portal can be demonstrated.
   */
  businessId: string | null
  isStub: boolean
}

const ROLE_VALUES: UserRole[] = ['admin', 'editor', 'contributor', 'business_owner']

function isRole(value: string | undefined): value is UserRole {
  return !!value && (ROLE_VALUES as string[]).includes(value)
}

export function isStubAuth(): boolean {
  if (process.env.NEXT_PUBLIC_AUTH_MODE === 'supabase') return false
  return process.env.NEXT_PUBLIC_AUTH_MODE === 'stub' || !hasSupabase()
}

/** /dev/login and the role switcher must never exist in production. */
export function devAuthAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && isStubAuth()
}

async function getStubSession(): Promise<Session | null> {
  if (!devAuthAllowed()) return null

  const store = await cookies()
  const cookieRole = store.get(DEV_ROLE_COOKIE)?.value
  const envRole = process.env.DEV_ROLE
  const role = isRole(cookieRole) ? cookieRole : isRole(envRole) ? envRole : null

  if (!role) return null

  return {
    userId: `stub-${role}`,
    email: `${role}@heartlandja.local`,
    fullName: `Demo ${role.replace('_', ' ')}`,
    role,
    businessId: store.get(DEV_BUSINESS_COOKIE)?.value ?? null,
    isStub: true,
  }
}

async function getSupabaseSession(): Promise<Session | null> {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  // A business owner's portal needs to know which listing is theirs.
  let businessId: string | null = null
  if (profile?.role === 'business_owner') {
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', user.id)
      .limit(1)
      .maybeSingle()
    businessId = business?.id ?? null
  }

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as UserRole) ?? 'contributor',
    businessId,
    isStub: false,
  }
}

export async function getSession(): Promise<Session | null> {
  return isStubAuth() ? getStubSession() : getSupabaseSession()
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/**
 * Route guard. Redirects an anonymous visitor to sign in; returns 403 for a
 * signed-in user whose role is wrong (so we never leak that the route exists
 * by bouncing them to a login page they are already past).
 */
export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!roles.includes(session.role)) forbidden()
  return session
}

export function isStaff(role: UserRole): boolean {
  return role === 'admin' || role === 'editor' || role === 'contributor'
}

export function canEditContent(role: UserRole): boolean {
  return role === 'admin' || role === 'editor'
}

export function canManageDirectory(role: UserRole): boolean {
  return role === 'admin'
}
