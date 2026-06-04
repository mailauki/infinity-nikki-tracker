import { getTrials } from '@/hooks/data/trials'
import { Suspense } from 'react'
import TrialView from './trial-view'

export default function TrialsDashboard() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  )
}

async function DashboardView() {
  const trials = await getTrials()
  return <TrialView trials={trials} />
}
