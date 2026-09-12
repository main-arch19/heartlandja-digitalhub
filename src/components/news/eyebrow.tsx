import Link from 'next/link'

import { NEWS_CATEGORY_LABELS } from '@/lib/constants'
import { townSlug } from '@/lib/utils'
import type { NewsPost, Topic } from '@/types/db'

/**
 * The story eyebrow — `Denbigh Show · Denbigh`.
 *
 * Ground News runs `Topic · Place` above every headline, and that pairing is
 * what makes a dense list scannable: you know what a story is about and where
 * it happened before you read a word of the headline.
 *
 * The leading term is the story's first topic where it has one, falling back to
 * its category. That fallback matters — category is a required enum, topics are
 * optional, so an untagged story still gets a meaningful eyebrow rather than a
 * bare town name.
 *
 * Two variants, because the same line serves two jobs:
 *
 *   linked   on story pages, where the eyebrow is navigation.
 *   plain    inside compact rows, where the whole row is already one tap target
 *            via the stretched-link pattern. A link inside a stretched link
 *            either swallows the row's tap or is unreachable; neither is worth
 *            the extra navigation on a row a reader is scanning past.
 */

function leadTerm(
  post: NewsPost,
  topics: Topic[],
  excludeTopicId?: string,
): { label: string; href: string | null } {
  // On a topic page every row already sits under that topic's heading, so
  // repeating it in each eyebrow says nothing. Lead with the story's next
  // topic instead — that is the part the reader does not already know — and
  // fall back to the category when this was the story's only topic.
  const topic = topics.find((t) => t.id !== excludeTopicId)
  if (topic) return { label: topic.name, href: `/topics/${topic.slug}` }
  return { label: NEWS_CATEGORY_LABELS[post.category], href: null }
}

export function StoryEyebrow({
  post,
  topics = [],
  linked = false,
  excludeTopicId,
}: {
  post: NewsPost
  topics?: Topic[]
  /** Render as links. Never use inside a stretched-link row. */
  linked?: boolean
  /** The topic whose page this is, so the eyebrow does not repeat it. */
  excludeTopicId?: string
}) {
  const lead = leadTerm(post, topics, excludeTopicId)

  return (
    <p className="eyebrow">
      {linked && lead.href ? (
        <Link href={lead.href} className="hover:text-green">
          {lead.label}
        </Link>
      ) : (
        lead.label
      )}

      {post.town ? (
        <>
          <span aria-hidden="true"> · </span>
          {linked ? (
            <Link
              href={`/news/town/${townSlug(post.town)}`}
              className="hover:text-green"
            >
              {post.town}
            </Link>
          ) : (
            post.town
          )}
        </>
      ) : null}
    </p>
  )
}

/**
 * Topic chips — the related-topics strip, and the tag list on a story.
 *
 * Not the eyebrow: this is the full set, where the eyebrow shows only the
 * leading one.
 */
export function TopicChips({
  topics,
  label,
}: {
  topics: Topic[]
  label?: string
}) {
  if (topics.length === 0) return null

  return (
    <section>
      {label ? (
        <>
          <h2 className="eyebrow">{label}</h2>
          <hr className="rule-gold mt-2 mb-3" />
        </>
      ) : null}

      <ul className="flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <li key={topic.id}>
            <Link
              href={`/topics/${topic.slug}`}
              className="chip-target pressable rounded-sm border border-rule bg-paper-raised px-3 text-xs text-ink-muted transition-colors hover:border-green hover:text-green"
            >
              {topic.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
