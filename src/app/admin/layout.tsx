import Link from 'next/link'

import { requireRole } from '@/lib/auth'

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

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/directory', label: 'Directory' },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole('admin', 'editor')

  return (
    <div>
      <div className="border-b border-rule bg-paper-sunken">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav aria-label="Admin" className="flex items-center gap-5">
            <span className="eyebrow">Admin</span>
            {ADMIN_NAV.map((item) => (
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
