import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText, richTextToPlainText } from '@/components/editorial/rich-text'
import { RelatedListings } from '@/components/directory/listing-card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { ShareRow } from '@/components/social/share-row'
import { JsonLd } from '@/components/seo/json-ld'
import { NEWS_CATEGORY_LABELS } from '@/lib/constants'
import { getRelatedListings } from '@/lib/data/directory'
import { getNewsBySlug } from '@/lib/data/news'
import { breadcrumbJsonLd, newsArticleJsonLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { formatDate, townSlug, truncate } from '@/lib/utils'

/**
 * News post.
 *
 * Phase 3 owns the full news engine — archive, categories, editor UI, RSS. This
 * page exists in Phase 2 because the homepage links to seeded posts, and
 * because it is where the related-listings mechanism is proven: a story about
 * May Pen surfaces May Pen businesses, which is how editorial traffic becomes
 * listing value.
 *
 * NOTE: the permanent URL specified for Phase 3 is
 * /news/[year]/[month]/[slug]. This interim route is /news/[slug]. When the
 * dated route lands, this one should 301 to it rather than being deleted —
 * any link shared in the meantime must keep working.
 */

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getNewsBySlug(slug)
  if (!post) return { title: 'Not found' }

  return buildMetadata({
    title: post.title,
    description:
      post.excerpt ?? truncate(richTextToPlainText(post.body), 160),
    path: `/news/${slug}`,
    seo: post,
    type: 'article',
    publishedTime: post.publish_date,
    modifiedTime: post.updated_at,
    section: NEWS_CATEGORY_LABELS[post.category],
  })
}

export default async function NewsPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getNewsBySlug(slug)

  if (!post || post.status !== 'published') notFound()

  // The internal-linking mechanism: match listings to the story's town.
  const related = await getRelatedListings({ town: post.town, limit: 5 })

  const path = `/news/${slug}`
  const crumbs = [
    { name: 'News', path: '/news' },
    { name: post.title, path },
  ]

  return (
    <>
      <JsonLd data={newsArticleJsonLd(post, { path })} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article>
            <p className="eyebrow">{NEWS_CATEGORY_LABELS[post.category]}</p>

            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-[2.5rem]">
              {post.title}
            </h1>

            {post.excerpt ? <p className="standfirst mt-4 measure">{post.excerpt}</p> : null}

            <p className="mt-4 text-xs text-ink-faint">
              <time dateTime={post.publish_date ?? undefined}>
                {formatDate(post.publish_date)}
              </time>
              {post.town ? (
                <>
                  {' · '}
                  <Link
                    href={`/directory/town/${townSlug(post.town)}`}
                    className="underline underline-offset-2 hover:text-green"
                  >
                    {post.town}
                  </Link>
                </>
              ) : null}
            </p>

            <hr className="rule-gold my-7" />

            <RichText doc={post.body} />

            <div className="mt-10">
              <ShareRow path={path} title={post.title} />
            </div>
          </article>

          <aside className="lg:border-l lg:border-rule lg:pl-8">
            <RelatedListings
              businesses={related}
              heading={post.town ? `Businesses in ${post.town}` : 'From the directory'}
              town={post.town}
            />
          </aside>
        </div>
      </div>
    </>
  )
}
