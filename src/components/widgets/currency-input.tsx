'use client'

import { useState } from 'react'

/**
 * The interactive half of the currency card.
 *
 * Deliberately tiny. The rate arrives as a prop from the server component, so
 * this does arithmetic and nothing else — no fetching, no network call per
 * keystroke, no formatting library.
 *
 * The amount is held as a string rather than a number so a half-typed value
 * ("1.", "0.0") survives editing instead of being rewritten under the cursor.
 */

function formatJmd(value: number): string {
  return new Intl.NumberFormat('en-JM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CurrencyInput({ rate }: { rate: number }) {
  const [amount, setAmount] = useState('100')

  const parsed = Number.parseFloat(amount)
  const usd = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  const converted = usd * rate

  return (
    <div>
      <label htmlFor="usd-amount" className="sr-only">
        Amount in US dollars
      </label>

      <div className="flex items-center justify-between gap-3 rounded-sm bg-paper-raised px-3 py-2.5">
        <span className="text-sm font-medium text-ink-muted">USD</span>
        <input
          id="usd-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(event) => {
            const next = event.target.value
            // Digits and at most one decimal point. Rejecting the keystroke
            // rather than sanitising after the fact keeps the caret stable.
            if (next === '' || /^\d*\.?\d*$/.test(next)) setAmount(next)
          }}
          aria-describedby="jmd-result"
          className="tap-target min-w-0 flex-1 bg-transparent text-right font-display text-xl font-semibold text-ink tnum focus:outline-none"
        />
      </div>

      <div aria-hidden="true" className="flex justify-center py-1.5">
        <ArrowDown />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-sm bg-green-wash px-3 py-2.5">
        <span className="text-sm font-medium text-green">JMD</span>
        <output
          id="jmd-result"
          htmlFor="usd-amount"
          aria-live="polite"
          className="min-w-0 truncate text-right font-display text-xl font-semibold text-green-deep tnum"
        >
          {formatJmd(converted)}
        </output>
      </div>
    </div>
  )
}

function ArrowDown() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gold"
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}
