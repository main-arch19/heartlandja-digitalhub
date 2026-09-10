'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession, requireRole } from '@/lib/auth'
import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'

/**
 * Write operations.
 *
 * Every write goes through a server action here. Two rules hold throughout:
 *
 *  1. Writes never silently no-op. With no Supabase configured they return a
 *     clear error, so a missing backend is obvious rather than mysterious.
 *  2. Authorisation is checked here AND enforced by RLS in the database. The
 *     check here produces a good error message; the database check is what
 *     actually protects the data.
 */

export interface ActionResult {
  ok: boolean
  message?: string
  fieldErrors?: Record<string, string>
}

const NO_BACKEND: ActionResult = {
  ok: false,
  message:
    'No database is connected yet, so changes cannot be saved. Add your Supabase credentials to .env.local to enable saving.',
}

// ---------------------------------------------------------------------------
// Owner: update own listing
// ---------------------------------------------------------------------------

/**
 * Note what is absent: tier, status, listing dates, slug and ownership. Those
 * are admin-only and are additionally blocked by a database trigger, so an
 * owner cannot grant themselves a better tier by crafting a request.
 */
const ownerListingSchema = z.object({
  description: z.string().trim().max(600).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
})

export async function updateOwnListing(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession()

  if (!session || (session.role !== 'business_owner' && session.role !== 'admin')) {
    return { ok: false, message: 'You are not signed in as a business owner.' }
  }
  if (!session.businessId) {
    return { ok: false, message: 'No listing is linked to your account.' }
  }

  const parsed = ownerListingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string') fieldErrors[key] = issue.message
    }
    return { ok: false, message: 'Please check the highlighted fields.', fieldErrors }
  }

  if (!hasSupabase()) return NO_BACKEND

  const supabase = await getSupabaseServerClient()
  const values = parsed.data

  const { error } = await supabase!
    .from('businesses')
    .update({
      description: values.description || null,
      address: values.address || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      website: values.website || null,
    })
    .eq('id', session.businessId)

  if (error) {
    return { ok: false, message: `Could not save: ${error.message}` }
  }

  revalidatePath('/business/listing')
  revalidatePath('/business')

  return { ok: true, message: 'Your listing has been updated.' }
}

// ---------------------------------------------------------------------------
// Admin: directory management
// ---------------------------------------------------------------------------

const adminListingSchema = z.object({
  businessId: z.string().min(1),
  status: z.enum(['enquiry', 'pending', 'active', 'expired', 'suspended']),
  tierId: z.string().min(1),
  listingStart: z.string().optional().or(z.literal('')),
  listingExpiry: z.string().optional().or(z.literal('')),
})

export async function updateListingAdmin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole('admin')

  const parsed = adminListingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, message: 'Invalid submission.' }
  }

  if (!hasSupabase()) return NO_BACKEND

  const supabase = await getSupabaseServerClient()
  const values = parsed.data

  const { error } = await supabase!
    .from('businesses')
    .update({
      status: values.status,
      tier_id: values.tierId,
      listing_start: values.listingStart || null,
      listing_expiry: values.listingExpiry || null,
    })
    .eq('id', values.businessId)

  if (error) return { ok: false, message: `Could not save: ${error.message}` }

  revalidatePath('/admin/directory')
  revalidatePath('/directory')

  return { ok: true, message: 'Listing updated.' }
}

// ---------------------------------------------------------------------------
// Public: listing enquiry from /advertise
// ---------------------------------------------------------------------------

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your business name').max(120),
  town: z.string().trim().min(2, 'Enter your town or district').max(80),
  categoryId: z.string().min(1, 'Choose a category'),
  contactName: z.string().trim().min(2, 'Enter your name').max(120),
  phone: z.string().trim().min(7, 'Enter a phone number').max(40),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  tierSlug: z.string().min(1),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  // Honeypot: a real person leaves this empty; a bot fills every field.
  website_url: z.string().max(0).optional().or(z.literal('')),
})

export async function submitListingEnquiry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string') fieldErrors[key] = issue.message
    }
    return { ok: false, message: 'Please check the highlighted fields.', fieldErrors }
  }

  const values = parsed.data

  // Silently accept honeypot submissions so a bot cannot detect the filter.
  if (values.website_url) return { ok: true, message: 'Thank you — we will be in touch.' }

  if (!hasSupabase()) {
    return {
      ok: false,
      message:
        'The enquiry form is not connected to a database yet. Please email hello@heartlandja.com in the meantime.',
    }
  }

  const supabase = await getSupabaseServerClient()

  const { data: tier } = await supabase!
    .from('listing_tiers')
    .select('id')
    .eq('slug', values.tierSlug)
    .maybeSingle()

  if (!tier) return { ok: false, message: 'That listing option is no longer available.' }

  const baseSlug = values.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { error } = await supabase!.from('businesses').insert({
    name: values.name,
    // Suffixed to avoid colliding with an existing listing's slug; an admin
    // sets the final slug on approval.
    slug: `${baseSlug}-${Date.now().toString(36)}`,
    category_id: values.categoryId,
    tier_id: tier.id,
    town: values.town,
    phone: values.phone,
    email: values.email || null,
    description: values.message || null,
    status: 'enquiry',
  })

  if (error) {
    console.error('[enquiry] insert failed', error.message)
    return {
      ok: false,
      message: 'Something went wrong submitting your enquiry. Please try again.',
    }
  }

  revalidatePath('/admin/directory')

  return {
    ok: true,
    message: 'Thank you — your enquiry has been received. We will be in touch shortly.',
  }
}
