import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'

export const metadata = {
  title: 'Parish News',
  robots: comingSoonRobots,
}

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Every week"
      title="Parish News"
      description="Council decisions, school results, sports, road works, business openings and community events from across Clarendon."
      phase="the news engine arrives in Phase 3"
    />
  )
}
