import { NextResponse, type NextRequest } from 'next/server'

import { getSession } from '@/lib/auth'
import { getBusinessById } from '@/lib/data/directory'
import { getListingMetrics, metricsToCsv } from '@/lib/data/metrics'
import { slugify } from '@/lib/utils'

/**
 * CSV export of the owner's own listing report.
 *
 * The business id comes from the session, never from a query parameter — there
 * is no id to tamper with. The metrics RPC re-checks ownership in the database
 * regardless.
 */

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== 'business_owner' && session.role !== 'admin')) {
    return new NextResponse('Not authorised', { status: 403 })
  }

  if (!session.businessId) {
    return new NextResponse('No listing linked to this account', { status: 404 })
  }

  const daysParam = request.nextUrl.searchParams.get('days')
  const days = daysParam === '90' ? 90 : 30

  const business = await getBusinessById(session.businessId)
  if (!business) return new NextResponse('Listing not found', { status: 404 })

  const { metrics } = await getListingMetrics(session.businessId, days)
  const csv = metricsToCsv(metrics, business.name, days)

  const filename = `heartland-ja-${slugify(business.name)}-${days}day-report.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
