import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'

export const metadata = {
  title: 'Clarendon History',
  robots: comingSoonRobots,
}

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Evergreen"
      title="Clarendon History"
      description="The parish told through its places and its past, browsable by era and district."
      phase="the history section arrives in Phase 3"
    />
  )
}
