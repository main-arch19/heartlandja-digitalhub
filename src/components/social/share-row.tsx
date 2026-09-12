import { SITE } from '@/lib/constants'
import { absoluteUrl } from '@/lib/utils'

import { CopyLinkButton } from './copy-link-button'

/**
 * Share links.
 *
 * Plain anchors to each network's share endpoint — no SDK, no tracking pixel,
 * no third-party script. Facebook and WhatsApp read the OpenGraph tags from the
 * shared URL, which is why every page emits a correct `og:image`.
 *
 * Instagram has no web share endpoint (it does not accept an outbound link that
 * way), so the copy-link button is the Instagram path: copy, then paste into a
 * story or bio. That is the honest mechanism rather than a button that fails.
 */

export function ShareRow({ path, title }: { path: string; title: string }) {
  const url = absoluteUrl(path)

  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  const email = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}\n\nvia ${SITE.name}`)}`

  const linkClass =
    'pressable tap-target inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 text-xs font-medium text-ink-muted transition-colors hover:border-green hover:text-green'

  return (
    <div>
      <h2 className="eyebrow">Share</h2>
      <hr className="rule-gold mt-2 mb-3" />
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Share on Facebook"
        >
          Facebook
        </a>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Share on WhatsApp"
        >
          WhatsApp
        </a>
        <a href={email} className={linkClass} aria-label="Share by email">
          Email
        </a>
        <CopyLinkButton url={url} className={linkClass} />
      </div>
    </div>
  )
}
