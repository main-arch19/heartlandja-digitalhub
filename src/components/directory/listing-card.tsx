import Link from 'next/link'

import { townSlug } from '@/lib/utils'
import type { BusinessWithRelations } from '@/types/db'

/**
 * Directory listing card.
 *
 * Fully server-rendered. The phone number is a plain `tel:` link here rather
 * than a tracked one — card-level taps are attributed to the listing page in
 * Phase 2, and adding a client component to every card in a list of fifty would
 * cost more bundle than the extra data point is worth.
 */

export function ListingCard({
  business,
  showCategory = true,
}: {
  business: BusinessWithRelations
  showCategory?: boolean
}) {
  const href = `/directory/${business.category.slug}/${business.slug}`
  const isFeatured = business.tier.featured_placement

  return (
    <article
      className={
        isFeatured
          ? 'relative rounded-sm border border-gold/50 bg-gold-wash/40 p-5 transition-colors hover:border-gold'
          : 'relative rounded-sm border border-rule bg-paper-raised p-5 transition-colors hover:border-rule-strong'
      }
    >
      {isFeatured ? (
        <span className="eyebrow absolute right-4 top-4 text-[0.625rem]">
          Featured
        </span>
      ) : null}

      <h3 className="font-display text-lg font-semibold leading-snug">
        {/* Stretched link: the whole card is the target, but only one link is
            in the accessibility tree. */}
        <Link href={href} className="after:absolute after:inset-0 hover:text-green">
          {business.name}
        </Link>
      </h3>

      <p className="mt-1 text-sm text-ink-faint">
        {showCategory ? (
          <>
            {business.category.name}
            <span aria-hidden="true"> · </span>
          </>
        ) : null}
        {business.town}
      </p>

      {business.description ? (
        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {business.description}
        </p>
      ) : null}

      {business.phone ? (
        <p className="mt-3 text-sm font-medium text-green tnum">{business.phone}</p>
      ) : null}
    </article>
  )
}

/** Compact variant for sidebars and related-listing rails. */
export function ListingCardCompact({ business }: { business: BusinessWithRelations }) {
  const href = `/directory/${business.category.slug}/${business.slug}`

  return (
    <article className="relative border-b border-rule py-3 last:border-0">
      <h3 className="text-[0.9375rem] font-medium leading-snug">
        <Link href={href} className="after:absolute after:inset-0 hover:text-green">
          {business.name}
        </Link>
      </h3>
      <p className="mt-0.5 text-xs text-ink-faint">
        {business.category.name}
        <span aria-hidden="true"> · </span>
        {business.town}
      </p>
    </article>
  )
}

/**
 * Related listings block.
 *
 * Phase 2 renders this on listing pages. Phase 3 drops the same component into
 * news posts — that is the mechanism that turns editorial traffic into listing
 * value, so it is built once and reused rather than reimplemented.
 */
export function RelatedListings({
  businesses,
  heading,
  town,
}: {
  businesses: BusinessWithRelations[]
  heading: string
  town?: string | null
}) {
  if (businesses.length === 0) return null

  return (
    <section aria-labelledby="related-listings" className="mt-10">
      <h2 id="related-listings" className="eyebrow">
        {heading}
      </h2>
      <hr className="rule-gold mt-2 mb-1" />
      <div>
        {businesses.map((business) => (
          <ListingCardCompact key={business.id} business={business} />
        ))}
      </div>
      {town ? (
        <p className="mt-3 text-sm">
          <Link
            href={`/directory/town/${townSlug(town)}`}
            className="text-green underline underline-offset-2 hover:text-green-light"
          >
            All businesses in {town}
          </Link>
        </p>
      ) : null}
    </section>
  )
}
