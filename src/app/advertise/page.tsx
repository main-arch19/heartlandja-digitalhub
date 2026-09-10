import type { Metadata } from 'next'

import { EnquiryForm } from '@/components/directory/enquiry-form'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { getCategories, getTiers } from '@/lib/data/directory'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { formatMoney } from '@/lib/utils'

/**
 * Rate card and enquiry.
 *
 * Closes the loop: an enquiry submitted here becomes a `businesses` row at
 * status `enquiry`, landing directly in the admin approval queue.
 */

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Advertise in the Clarendon Business Directory',
    description:
      'List your Clarendon business on Heartland JA. Free and paid listings with photographs, WhatsApp, website links and a monthly report showing how many people called, messaged or asked for directions.',
    path: '/advertise',
  })
}

export default async function AdvertisePage() {
  const [tiers, categories] = await Promise.all([getTiers(), getCategories()])

  const crumbs = [{ name: 'Advertise', path: '/advertise' }]

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <p className="eyebrow">For Clarendon businesses</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Be found by people already looking
          </h1>
          <p className="standfirst mt-4">
            Heartland JA publishes parish news every week. Every story is a permanent
            page that brings people to the site — and every listing sits alongside
            them.
          </p>
        </header>

        {/* --- Tiers --- */}
        <section className="mt-12">
          <h2 className="eyebrow">Listing options</h2>
          <hr className="rule-gold mt-2 mb-6" />

          <div className="grid gap-5 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={
                  tier.featured_placement
                    ? 'flex flex-col rounded-sm border-2 border-gold bg-gold-wash/40 p-6'
                    : 'flex flex-col rounded-sm border border-rule bg-paper-raised p-6'
                }
              >
                <h3 className="font-display text-xl font-semibold">{tier.name}</h3>

                <p className="mt-2">
                  <span className="font-display text-3xl font-semibold tnum">
                    {formatMoney(tier.price_jmd)}
                  </span>
                  {tier.price_jmd > 0 ? (
                    <span className="ml-1.5 text-sm text-ink-faint">
                      / {tier.term_months} months
                    </span>
                  ) : null}
                </p>

                {tier.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {tier.description}
                  </p>
                ) : null}

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 shrink-0 text-gold">
                        ✓
                      </span>
                      <span className="text-ink-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 border-t border-rule pt-4 text-xs text-ink-faint">
                  <a href="#enquire" className="text-green underline underline-offset-2">
                    Enquire about {tier.name}
                  </a>
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-prose text-xs leading-relaxed text-ink-faint">
            Listings are invoiced directly and settled by bank transfer, cash or
            cheque. Prices are in Jamaican dollars.
          </p>
        </section>

        {/* --- What you get back --- */}
        <section className="mt-14">
          <h2 className="eyebrow">What your listing reports back</h2>
          <hr className="rule-gold mt-2 mb-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Listing views',
                body: 'How many people opened your listing page.',
              },
              {
                title: 'Phone taps',
                body: 'How many tapped your number to call you.',
              },
              {
                title: 'Directions',
                body: 'How many asked for directions to your premises.',
              },
              {
                title: 'WhatsApp messages',
                body: 'How many opened WhatsApp to message you.',
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-base font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink-muted">
            Paid listings get their own login showing these figures over 30 and 90
            days, compared against the average for their category — so you can see
            exactly what your listing is doing before you decide to renew.
          </p>
        </section>

        {/* --- Enquiry --- */}
        <section id="enquire" className="mt-14 scroll-mt-8">
          <h2 className="eyebrow">Enquire about a listing</h2>
          <hr className="rule-gold mt-2 mb-6" />
          <div className="max-w-xl">
            <EnquiryForm categories={categories} tiers={tiers} />
          </div>
        </section>
      </div>
    </>
  )
}
