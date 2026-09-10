import { ComingSoon, comingSoonRobots } from '@/components/layout/coming-soon'

export const metadata = {
  title: 'Search',
  robots: comingSoonRobots,
}

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Find"
      title="Search"
      description="Search news, magazine articles, history and the business directory."
      phase="site-wide search arrives in Phase 3"
    />
  )
}
