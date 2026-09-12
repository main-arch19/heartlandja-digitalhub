import Link from 'next/link'

import { requireRole } from '@/lib/auth'
import type { UserRole } from '@/types/db'

/**
 * Admin shell.
 *
 * The role check runs here, so every page under /admin inherits it. Middleware
 * has already redirected anonymous visitors; this is what enforces which role.
 */

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

/**
 * Nav is filtered by role. A contributor writes stories and sees nothing else:
 * the dashboard and directory are commercial, and their own pages already
 * enforce admin/editor — showing links that only lead to a 403 is a worse
 * experience than not showing them.
 */
const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', roles: ['admin', 'editor'] },
  { href: '/admin/news', label: 'News', roles: ['admin', 'editor', 'contributor'] },
  { href: '/admin/directory', label: 'Directory', roles: ['admin', 'editor'] },
] as const satisfies readonly {
  href: string
  label: string
  roles: readonly UserRole[]
}[]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Contributors are admitted here so they can reach /admin/news; every other
  // admin page still calls requireRole('admin', 'editor') itself. Gating them
  // out at the layout would have made the news editor unreachable for exactly
  // the people the brief names as writing the weekly stories.
  const session = await requireRole('admin', 'editor', 'contributor')
  const nav = ADMIN_NAV.filter((item) =>
    (item.roles as readonly UserRole[]).includes(session.role),
  )

  return (
    <div>
      <div className="border-b border-rule bg-paper-sunken">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav aria-label="Admin" className="flex items-center gap-5">
            <span className="eyebrow">Admin</span>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ink-muted transition-colors hover:text-green"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-ink-faint">
            {session.fullName ?? session.email}
            <span className="ml-1.5 rounded-sm bg-green-wash px-1.5 py-0.5 text-green">
              {session.role}
            </span>
            {session.isStub ? (
              <span className="ml-1.5 text-gold">development session</span>
            ) : null}
          </p>
        </div>
      </div>
      {children}
    </div>
  )
}
