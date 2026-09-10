import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'

export const metadata = {
  title: 'Listen Live',
  robots: comingSoonRobots,
}

export default function Page() {
  return (
    <ComingSoon
      eyebrow="On air"
      title="Listen Live"
      description="Talk radio for Clarendon — interviews, discussion and parish news."
      phase="the live stream arrives in Phase 5"
    />
  )
}
