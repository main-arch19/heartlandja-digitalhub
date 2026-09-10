import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/editorial/rich-text'
import { ListingCard } from '@/components/directory/listing-card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import {
  getBusinessesByCategory,
  getCategories,
  getCategoryAncestry,
  getCategoryBySlug,
  getChildCategories,
  getCategoryTreeCounts,
} from '@/lib/data/directory'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata, categoryMetaDefaults } from '@/lib/seo/metadata'
import { townSlug } from '@/lib/utils'

/**
 * Category page — a programmatic SEO target.
 *
 * This is the page that must rank for "plumber in May Pen" and its equivalents.
 * It carries real editorial copy where an editor has written it; where none
 * exists it assembles a genuinely useful intro from actual data (how many
 * listings, which towns they cover) rather than a thin templated sentence.
 */

interface PageProps {
  params: Promise<{ category: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Category not found' }

  const businesses = await getBusinessesByCategory(slug)
  const defaults = categoryMetaDefaults(category.name, businesses.length)

  return buildMetadata({
    ...defaults,
    path: `/directory/${slug}`,
    seo: category,
  })
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [businesses, children, ancestry, treeCounts] = await Promise.all([
    getBusinessesByCategory(slug),
    getChildCategories(category.id),
    getCategoryAncestry(category),
    getCategoryTreeCounts(),
  ])

  const crumbs = [
    { name: 'Directory', path: '/directory' },
    ...ancestry.map((c) => ({ name: c.name, path: `/directory/${c.slug}` })),
  ]

  // Towns actually represented in this category — used for the generated intro
  // and for cross-links, both of which are real information rather than filler.
  const towns = [...new Set(businesses.map((b) => b.town))].sort()

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          businesses.map((b) => ({
            name: b.name,
            path: `/directory/${b.category.slug}/${b.slug}`,
          })),
          `${category.name} in Clarendon`,
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6 measure">
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {category.name} in Clarendon
          </h1>

          {/* Editor-written copy takes precedence. */}
          {category.seo_copy ? (
            <div className="mt-4">
              <RichText doc={category.seo_copy} />
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-[1.0625rem] leading-relaxed text-ink-muted">
              <p>
                {category.description ??
                  `${category.name} listed in the Heartland JA directory.`}
              </p>
              {businesses.length > 0 ? (
                <p>
                  {businesses.length}{' '}
                  {businesses.length === 1 ? 'business is' : 'businesses are'} listed
                  {towns.length > 0 ? (
                    <>
                      {' '}
                      across{' '}
                      {towns.slice(0, 4).map((town, i, arr) => (
                        <span key={town}>
                          <Link
                            href={`/directory/town/${townSlug(town)}`}
                            className="text-green underline underline-offset-2 hover:text-green-light"
                          >
                            {town}
                          </Link>
                          {i < arr.length - 1 ? (i === arr.length - 2 ? ' and ' : ', ') : ''}
                        </span>
                      ))}
                      {towns.length > 4 ? ` and ${towns.length - 4} other districts` : ''}
                    </>
                  ) : null}
                  . Each listing carries a phone number, opening hours and directions.
                </p>
              ) : null}
            </div>
          )}
        </header>

        {/* Sub-categories */}
        {children.length > 0 ? (
          <nav aria-label="Sub-categories" className="mt-8">
            <h2 className="eyebrow">Browse by type</h2>
            <hr className="rule-gold mt-2 mb-3" />
            <ul className="flex flex-wrap gap-2">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/directory/${child.slug}`}
                    className="tap-target inline-flex items-center rounded-sm border border-rule bg-paper-raised px-3 text-sm text-ink-muted transition-colors hover:border-green hover:text-green"
                  >
                    {child.name}
                    <span className="ml-1.5 text-xs text-ink-faint tnum">
                      {treeCounts.get(child.id) ?? 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* Listings */}
        <section className="mt-10">
          <h2 className="eyebrow">
            {businesses.length} {businesses.length === 1 ? 'listing' : 'listings'}
          </h2>
          <hr className="rule-gold mt-2 mb-5" />

          {businesses.length === 0 ? (
            <EmptyCategory categoryName={category.name} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <ListingCard key={business.id} business={business} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function EmptyCategory({ categoryName }: { categoryName: string }) {
  return (
    <div className="rounded-sm border border-rule bg-paper-sunken p-6">
      <p className="text-ink-muted">
        No {categoryName.toLowerCase()} are listed yet.
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        If you run this kind of business in Clarendon,{' '}
        <Link
          href="/advertise"
          className="text-green underline underline-offset-2 hover:text-green-light"
        >
          add your listing
        </Link>{' '}
        — a free entry puts you in front of people already searching.
      </p>
    </div>
  )
}
