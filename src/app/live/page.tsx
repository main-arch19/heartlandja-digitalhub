import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { RadioPlayer } from '@/components/live/radio-player'
import { JsonLd } from '@/components/seo/json-ld'
import { SITE } from '@/lib/constants'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

/**
 * Listen Live.
 *
 * Pulled forward out of Phase 5 so the station has a real page rather than a
 * placeholder. The page is complete; the stream behind it is not — see the
 * note in the player about why the disabled state is honest rather than a
 * stub.
 *
 * Indexed, unlike the remaining placeholders: it now carries real content
 * about a real station, so there is something for a search result to be
 * about.
 */

const CRUMBS = [{ name: 'Listen Live', path: '/live' }]

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: 'Listen Live',
    description:
      'Heartland JA Radio — talk radio for Clarendon. Interviews, discussion and parish news, streaming live.',
    path: '/live',
  })
}

export default function LivePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Breadcrumbs items={CRUMBS} />

        <header className="mt-6">
          <p className="eyebrow">On air</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Listen Live
          </h1>
          <p className="standfirst mt-4">
            Talk radio for Clarendon — interviews, discussion and parish news.
          </p>
        </header>

        <div className="mt-8">
          <RadioPlayer streamUrl={SITE.streamUrl} />
        </div>

        <hr className="rule-gold my-10" />

        <section className="space-y-4 text-[1.0625rem] leading-relaxed text-ink-muted">
          <h2 className="font-display text-xl font-semibold text-ink">
            What you are listening to
          </h2>
          <p>
            Heartland JA Radio is a talk station for the parish of Clarendon.
            Interviews with the people making decisions here, discussion of what
            those decisions mean, and the same parish news we publish in
            writing — read aloud, for anyone who would rather listen.
          </p>
          <p>
            The stream runs continuously. There is nothing to sign up for and
            nothing to download: press play and you join whatever is on at that
            moment, the way a radio has always worked.
          </p>
          <p className="text-sm text-ink-faint">
            Talk format only — no music.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-rule pt-6">
          <Link
            href="/podcast"
            className="pressable tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
          >
            The podcast
          </Link>
          <Link
            href="/news"
            className="pressable tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
          >
            Parish news
          </Link>
        </div>
      </div>
    </>
  )
}
