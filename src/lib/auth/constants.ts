/**
 * Auth cookie names.
 *
 * Kept in their own module with no imports so that middleware — which runs on
 * the Edge runtime — can use them without pulling in `lib/auth`, which depends
 * on `server-only`, Node crypto and the Supabase server client.
 */

export const DEV_ROLE_COOKIE = 'heartland_dev_role'
export const DEV_BUSINESS_COOKIE = 'heartland_dev_business'
