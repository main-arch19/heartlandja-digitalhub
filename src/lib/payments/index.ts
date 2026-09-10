import 'server-only'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types/db'

/**
 * Payments.
 *
 * At launch, listings are invoiced and settled offline — bank transfer, cash,
 * cheque — and an administrator records the outcome here. That is the entire
 * payment system for now, and it is deliberate: an online processor is a
 * recurring cost and a compliance surface that a directory with a handful of
 * founding advertisers does not need.
 *
 * Everything payment-related passes through this module. When a processor is
 * added later, the work is implementing `createCheckout` and a webhook handler
 * behind this same interface — no page, form or query elsewhere in the
 * application refers to payments directly.
 *
 * COST NOTE: adding a processor later introduces per-transaction fees (a
 * Jamaican gateway is typically 3–5% plus a fixed fee) and, for most, a monthly
 * charge. That is a business decision for the client, not a technical default.
 */

export interface RecordPaymentInput {
  businessId: string
  amountJmd: number
  termMonths: number
  status: PaymentStatus
  method?: PaymentMethod | null
  reference?: string | null
  invoicedAt?: string | null
  paidAt?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  notes?: string | null
}

export interface PaymentResult {
  ok: boolean
  message?: string
  payment?: Payment
}

export async function recordPayment(
  input: RecordPaymentInput,
): Promise<PaymentResult> {
  if (!hasSupabase()) {
    return {
      ok: false,
      message: 'No database is connected, so payments cannot be recorded yet.',
    }
  }

  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase!
    .from('payments')
    .insert({
      business_id: input.businessId,
      amount_jmd: input.amountJmd,
      term_months: input.termMonths,
      status: input.status,
      method: input.method ?? null,
      reference: input.reference ?? null,
      invoiced_at: input.invoicedAt ?? null,
      paid_at: input.paidAt ?? null,
      period_start: input.periodStart ?? null,
      period_end: input.periodEnd ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) return { ok: false, message: error.message }

  return { ok: true, payment: data as Payment }
}

export async function getPaymentsForBusiness(
  businessId: string,
): Promise<Payment[]> {
  if (!hasSupabase()) return []

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase!
    .from('payments')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  return (data as Payment[]) ?? []
}

/**
 * The integration point for a future online processor.
 *
 * Implementing this — and a matching webhook that calls `recordPayment` — is
 * the whole job of adding online payments. Nothing else in the application
 * needs to change.
 */
export async function createCheckout(): Promise<PaymentResult> {
  return {
    ok: false,
    message:
      'Online payment is not enabled. Listings are invoiced and settled offline; an administrator records payment in the admin.',
  }
}

/** Derives the expiry date an administrator should set for a given term. */
export function expiryForTerm(start: Date, termMonths: number): string {
  const expiry = new Date(start)
  expiry.setMonth(expiry.getMonth() + termMonths)
  return expiry.toISOString().slice(0, 10)
}
