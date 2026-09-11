import { formatDate } from '@/lib/utils'
import type { ExchangeRate } from '@/lib/data/widgets'

import { CurrencyInput } from './currency-input'

/**
 * USD to JMD converter.
 *
 * The rate is fetched server-side and passed down; only the input is a client
 * component. With JavaScript disabled the rate itself still reads correctly —
 * just the input stops recalculating.
 *
 * The labelling is deliberate. This is a mid-market reference rate that updates
 * once daily, not a rate any bank or cambio in May Pen will transact at. Saying
 * "Live" over it — as the original mockup did — would mislead a reader about
 * money, on a publication whose credibility is the product.
 */
export function CurrencyCard({ data }: { data: ExchangeRate | null }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">Currency</h2>
        {data ? (
          <span className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint">
            Reference rate
          </span>
        ) : null}
      </div>
      <hr className="rule-gold mt-2 mb-4" />

      <div className="rounded-sm border border-rule bg-paper-sunken p-4">
        {data ? (
          <>
            <CurrencyInput rate={data.rate} />

            <p className="mt-3 border-t border-rule pt-3 text-xs text-ink-faint tnum">
              1 USD = {data.rate.toFixed(2)} JMD
            </p>

            <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ink-faint">
              Mid-market rate, updated {formatDate(data.updatedAt, 'short')}. Banks
              and cambios set their own rates, so what you receive will differ.
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            The exchange rate is unavailable right now. Please check back shortly.
          </p>
        )}
      </div>
    </section>
  )
}
