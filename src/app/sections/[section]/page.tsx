import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'
import { getSectionBySlug, getSections } from '@/lib/data/news'

/**
 * Editorial subject-area index.
 *
 * The five sections are content taxonomy and exist from Phase 1, but the
 * articles that populate them arrive with the magazine in Phase 4. The route
 * exists now so the taxonomy is real and linkable; it is noindex until it has
 * content to show.
 */

interface PageProps {
  params: Promise<{ section: string }>
}

export async function generateStaticParams() {
  const sections = await getSections()
  return sections.map((s) => ({ section: s.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: slug } = await params
  const section = await getSectionBySlug(slug)
  if (!section) return { title: 'Not found' }

  return {
    title: section.name,
    description: section.description ?? undefined,
    robots: comingSoonRobots,
  }
}

export default async function SectionPage({ params }: PageProps) {
  const { section: slug } = await params
  const section = await getSectionBySlug(slug)
  if (!section) notFound()

  return (
    <ComingSoon
      eyebrow="Section"
      title={section.name}
      description={section.description ?? ''}
      phase="articles in this section arrive with the magazine in Phase 4"
    />
  )
}
