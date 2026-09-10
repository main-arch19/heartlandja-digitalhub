import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'

export const metadata = {
  title: 'The Magazine',
  robots: comingSoonRobots,
}

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Quarterly"
      title="The Magazine"
      description="Long-form writing on business, education, culture, tourism and sport in Clarendon."
      phase="the magazine arrives in Phase 4"
    />
  )
}
