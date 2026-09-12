import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NewsForm } from '@/components/admin/news-form'
import { requireRole } from '@/lib/auth'
import { getNewsById } from '@/lib/data/news'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Edit story',
  robots: { index: false, follow: false },
}

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireRole('admin', 'editor', 'contributor')
  const { id } = await params

  const post = await getNewsById(id)
  if (!post) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/news"
        className="text-xs text-ink-faint underline underline-offset-2 hover:text-green"
      >
        ← All stories
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Edit story</h1>
        {post.status === 'published' ? (
          <Link
            href={`/news/${post.slug}`}
            className="text-xs text-green underline underline-offset-2"
          >
            View published story ↗
          </Link>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-ink-muted">
        {post.status === 'published' && post.publish_date
          ? `Published ${formatDate(post.publish_date)}`
          : 'Not yet published'}
      </p>

      <div className="mt-7">
        <NewsForm post={post} role={session.role} />
      </div>
    </div>
  )
}
