'use client'

import { useState } from 'react'

/**
 * Copy-to-clipboard button.
 *
 * This is the Instagram share path: Instagram accepts no outbound web share
 * intent, so the workable route is copy-then-paste into a story or bio.
 *
 * Falls back silently if the Clipboard API is unavailable (older in-app
 * browsers, non-secure contexts) — the button simply does not confirm rather
 * than throwing at the visitor.
 */
export function CopyLinkButton({
  url,
  className,
}: {
  url: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — no visible failure */
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
    </button>
  )
}
