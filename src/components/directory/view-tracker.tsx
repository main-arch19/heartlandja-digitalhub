'use client'

import { useEffect, useRef } from 'react'

import { track } from '@/lib/analytics/track'

/**
 * Records a listing page view.
 *
 * Fires once per mount, after paint, so it never competes with rendering. The
 * ref guard survives React Strict Mode's double-effect in development, which
 * would otherwise double-count every local view.
 *
 * Renders nothing. A visitor without JavaScript is not counted as a view — that
 * is the correct trade: Postgres-side dedupe and bot filtering keep the number
 * honest, and an inflated view count is worse for the renewal conversation than
 * a slightly conservative one.
 */
export function ViewTracker({ businessId }: { businessId: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track(businessId, 'view')
  }, [businessId])

  return null
}
