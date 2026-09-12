import Link from 'next/link'

import { requireRole } from '@/lib/auth'
import { NEWS_CATEGORY_LABELS } from '@/lib/constants'
import { getAllNewsAdmin } from '@/lib/data/news'
import { hasSupabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { ContentStatus } from '@/types/db'

/**
 * The newsroom.
 *
 * Every story in every state, newest first — drafts included, which the public
 * index deliberately excludes. This is the page an editor lands on to file the
 * week's stories.
 */

const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: 'bg-gold-wash text-ink-muted',
  scheduled: 'bg-gold-wash text-ink-muted',
  published: 'bg-green-wash text-green',
  archived: 'bg-paper-sunken text-ink-faint',
}

export default async function AdminNewsPage() {
  await requireRole('admin', 'editor', 'contributor')
  const posts = await getAllNewsAdmin()

  const drafts = posts.filter((p) => p.status !== 'published').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Parish News</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {posts.length} {posts.length === 1 ? 'story' : 'stories'}
            {drafts > 0 ? ` · ${drafts} not yet published` : ''}
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="pressable tap-target inline-flex items-center rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
        >
          Write a story
        </Link>
      </div>

      {!hasSupabase() ? (
        <p className="mt-5 rounded-sm border border-gold/40 bg-gold-wash px-4 py-3 text-sm text-ink-muted">
          <strong className="font-medium text-ink">Demonstration data.</strong> No
          database is connected, so this shows the sample stories and saving is
          disabled. Add Supabase credentials to <code>.env.local</code> to publish
          for real.
        </p>
      ) : null}

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <caption className="sr-only">All news stories</caption>
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th scope="col" className="py-2 pr-3 font-medium">Headline</th>
              <th scope="col" className="py-2 pr-3 font-medium">Category</th>
              <th scope="col" className="py-2 pr-3 font-medium">Town</th>
              <th scope="col" className="py-2 pr-3 font-medium">Status</th>
              <th scope="col" className="py-2 pr-3 font-medium">Published</th>
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="py-2.5 pr-3 font-medium">{post.title}</td>
                <td className="py-2.5 pr-3 text-ink-muted">
                  {NEWS_CATEGORY_LABELS[post.category]}
                </td>
                <td className="py-2.5 pr-3 text-ink-muted">{post.town ?? '—'}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status]}`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-ink-muted tnum">
                  {post.publish_date ? formatDate(post.publish_date, 'short') : '—'}
                </td>
                <td className="py-2.5 text-right">
                  <Link
                    href={`/admin/news/${post.id}`}
                    className="text-green underline underline-offset-2 hover:text-green-light"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            No stories yet. Write the first one.
          </p>
        ) : null}
      </div>
    </div>
  )
}
