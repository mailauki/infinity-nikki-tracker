import { getTrials } from '@/hooks/data/trials'
import { Suspense } from 'react'
import TrialView from './trial-view'

export default function TrialsDashboard() {
  return (
    <Suspense>
      <DataTable />
    </Suspense>
  )
}

async function DataTable() {
  const trials = await getTrials()
  return <TrialView trials={trials} />
}
