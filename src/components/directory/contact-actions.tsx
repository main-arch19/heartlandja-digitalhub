'use client'

import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils'
import type { ListingEventType } from '@/types/db'

/**
 * Tracked contact links.
 *
 * The critical property: these are real anchors with real hrefs. If JavaScript
 * never loads — a slow 4G connection, an in-app browser, a blocked bundle — the
 * phone number still dials and the directions still open. Tracking is added on
 * top of a working link, never in place of one.
 *
 * `onClick` fires a beacon and returns immediately; navigation is not delayed
 * and is never intercepted with preventDefault.
 */

interface TrackedLinkProps {
  businessId: string
  eventType: ListingEventType
  href: string
  external?: boolean
  className?: string
  children: React.ReactNode
  'aria-label'?: string
}

export function TrackedLink({
  businessId,
  eventType,
  href,
  external,
  className,
  children,
  ...rest
}: TrackedLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track(businessId, eventType)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

/**
 * Primary contact button. 44px minimum height for thumb targets on mobile.
 */
export function ContactButton({
  businessId,
  eventType,
  href,
  external,
  variant = 'secondary',
  icon,
  label,
  sublabel,
}: {
  businessId: string
  eventType: ListingEventType
  href: string
  external?: boolean
  variant?: 'primary' | 'secondary' | 'whatsapp'
  icon: React.ReactNode
  label: string
  sublabel?: string
}) {
  const styles = {
    primary: 'bg-green text-paper border-green hover:bg-green-deep',
    secondary:
      'bg-paper-raised text-ink border-rule-strong hover:border-green hover:text-green',
    whatsapp: 'bg-[#1f7a4d] text-white border-[#1f7a4d] hover:bg-[#186139]',
  }[variant]

  return (
    <TrackedLink
      businessId={businessId}
      eventType={eventType}
      href={href}
      external={external}
      aria-label={sublabel ? `${label}: ${sublabel}` : label}
      className={cn(
        'pressable tap-target flex items-center gap-3 rounded-sm border px-4 py-3 text-left transition-colors',
        styles,
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {sublabel ? (
          <span className="block truncate text-xs opacity-80">{sublabel}</span>
        ) : null}
      </span>
    </TrackedLink>
  )
}

export function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  )
}

export function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.700-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 5 5 0 0 0 2.6.6 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
    </svg>
  )
}

export function DirectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function WebsiteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  )
}
