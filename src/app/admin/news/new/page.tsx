import Link from 'next/link'

import { NewsForm } from '@/components/admin/news-form'
import { requireRole } from '@/lib/auth'

export const metadata = {
  title: 'Write a story',
  robots: { index: false, follow: false },
}

export default async function NewNewsPage() {
  const session = await requireRole('admin', 'editor', 'contributor')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/news"
        className="text-xs text-ink-faint underline underline-offset-2 hover:text-green"
      >
        ← All stories
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold">Write a story</h1>

      <div className="mt-7">
        <NewsForm role={session.role} />
      </div>
    </div>
  )
}
