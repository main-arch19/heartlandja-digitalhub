import Link from 'next/link'

import { EditorialImage } from '@/components/editorial/editorial-image'
import { richTextToPlainText } from '@/components/editorial/rich-text'
import { StoryEyebrow } from '@/components/news/eyebrow'
import { formatDate, readingTimeFromText, townSlug } from '@/lib/utils'
import type { NewsPost, Topic } from '@/types/db'

/**
 * News story rows.
 *
 * The layout follows the pattern Ground News uses, measured from their live
 * pages: a large lead card, then compact imageless rows where a big bold
 * headline sits against small quiet metadata. Most rows carry no image, which
 * is precisely what lets a dozen stories fit on one screen instead of three.
 *
 * What is NOT borrowed: their bias bars and "23 sources" counts. Those describe
 * aggregation across many outlets. Heartland is a single newsroom writing
 * original parish reporting — there is no second outlet to compare against, and
 * inventing those figures on a publication whose whole value is trustworthiness
 * would be fabricating data. The metadata line carries date and reading time
 * instead: the same scannable rhythm, every figure true.
 *
 * The typography is Heartland's own — Fraunces headlines, gold eyebrows, cream
 * and white grounds — not Ground News' colours or their sans-everywhere stack.
 */

/** `12 January 2026 · 2 min read` */
function StoryMeta({ post, short = false }: { post: NewsPost; short?: boolean }) {
  const minutes = readingTimeFromText(richTextToPlainText(post.body))

  return (
    <p className="mt-2 text-xs text-ink-faint">
      <time dateTime={post.publish_date ?? undefined}>
        {formatDate(post.publish_date, short ? 'short' : 'long')}
      </time>
      <span aria-hidden="true"> · </span>
      {minutes} min read
    </p>
  )
}

/**
 * The lead story. Larger headline, excerpt, and an optional hero image.
 *
 * Deliberately the only story on the index that gets an image: if everything
 * carries one, nothing leads.
 */
export function StoryLead({
  post,
  topics = [],
  excludeTopicId,
}: {
  post: NewsPost
  topics?: Topic[]
  excludeTopicId?: string
}) {
  return (
    <article className="relative pb-8">
      {/* The hero leads when one exists, and the block simply starts at the
          eyebrow when it does not — no empty frame. This is the only story on
          an index that gets an image; if everything carries one, nothing
          leads. */}
      <EditorialImage
        src={post.hero_image_url}
        alt={post.hero_image_alt}
        ratio="3/2"
        sizes="(min-width: 1024px) 48rem, 100vw"
        priority
        className="mb-5"
      />

      {/* Not linked: the whole card is already one stretched-link tap target. */}
      <StoryEyebrow post={post} topics={topics} excludeTopicId={excludeTopicId} />

      <h2 className="display-lead mt-2 font-display font-semibold">
        <Link
          href={`/news/${post.slug}`}
          className="after:absolute after:inset-0 hover:text-green"
        >
          {post.title}
        </Link>
      </h2>

      {post.excerpt ? (
        <p className="standfirst mt-3 measure">{post.excerpt}</p>
      ) : null}

      <StoryMeta post={post} />
    </article>
  )
}

/**
 * The compact row — the workhorse of the index.
 *
 * No image, tight vertical rhythm, whole row is the tap target via the
 * stretched-link pattern used elsewhere in this codebase. Separated by a
 * hairline rule rather than a gap: Ground News uses pure whitespace, but this
 * publication's visual language already leans on rules and they read as
 * editorial rather than as chrome.
 */
export function StoryRow({
  post,
  topics = [],
  excludeTopicId,
}: {
  post: NewsPost
  topics?: Topic[]
  excludeTopicId?: string
}) {
  return (
    <article className="relative border-b border-rule py-4 last:border-0">
      {/* Not linked: the whole row is already one stretched-link tap target. */}
      <StoryEyebrow post={post} topics={topics} excludeTopicId={excludeTopicId} />

      <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug sm:text-[1.375rem]">
        <Link
          href={`/news/${post.slug}`}
          className="after:absolute after:inset-0 hover:text-green"
        >
          {post.title}
        </Link>
      </h3>

      {/*
        No excerpt here, deliberately. Measured against Ground News' own rows:
        a two-line excerpt was 46px — taller than the 30px headline — and the
        single largest contributor to row height. Dropping it takes the row from
        171px to roughly 125px, which is the difference between seven stories on
        a screen and ten. The headline and the `Category · Town` eyebrow already
        carry what a reader needs to decide; the excerpt is waiting for them on
        the story itself. The lead story keeps its excerpt, because one story
        being fuller is what makes it read as the lead.
      */}

      <StoryMeta post={post} short />
    </article>
  )
}

/** Town links for the sidebar — real cross-links into the directory. */
export function TownList({ towns }: { towns: string[] }) {
  if (towns.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-1.5">
      {towns.map((town) => (
        <li key={town}>
          <Link
            href={`/directory/town/${townSlug(town)}`}
            className="chip-target pressable rounded-sm border border-rule bg-paper-raised px-3 text-xs text-ink-muted transition-colors hover:border-green hover:text-green"
          >
            {town}
          </Link>
        </li>
      ))}
    </ul>
  )
}
