import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'

export const metadata = {
  title: 'The Podcast',
  robots: comingSoonRobots,
}

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Listen"
      title="The Podcast"
      description="Conversations and interviews from across the parish."
      phase="the podcast arrives in Phase 5"
    />
  )
}
