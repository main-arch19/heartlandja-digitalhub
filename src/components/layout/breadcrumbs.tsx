import Link from 'next/link'

/**
 * Breadcrumb trail.
 *
 * The visual counterpart to the `BreadcrumbList` JSON-LD emitted alongside it.
 * The last item is the current page and is not a link.
 */
export function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[]
}) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-faint">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-ink-muted">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="transition-colors hover:text-green">
                    {item.name}
                  </Link>
                  <span aria-hidden="true" className="text-rule-strong">
                    /
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
