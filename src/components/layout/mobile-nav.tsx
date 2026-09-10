'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * Mobile navigation toggle.
 *
 * The only client component in the header. Uses a native <dialog>-free
 * disclosure pattern so it works without heavy dependencies and stays
 * keyboard-accessible: Escape closes, focus returns to the trigger.
 */

interface MobileNavProps {
  links: readonly { href: string; label: string }[]
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="tap-target inline-flex items-center justify-center rounded-sm text-ink-muted transition-colors hover:text-green"
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div
        id="mobile-nav-panel"
        hidden={!open}
        className="absolute left-0 right-0 z-40 border-y border-rule bg-paper-raised shadow-sm"
      >
        <nav aria-label="Primary mobile">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {links.map((link) => (
              <li key={link.href} className="border-b border-rule last:border-0">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="tap-target flex items-center text-[0.9375rem] font-medium text-ink transition-colors hover:text-green"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-3 pb-2">
              <Link
                href="/advertise"
                onClick={() => setOpen(false)}
                className="tap-target inline-flex w-full items-center justify-center rounded-sm bg-green px-4 text-sm font-medium text-paper"
              >
                Advertise with us
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
