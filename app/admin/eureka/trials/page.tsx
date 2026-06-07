import { getTrials } from '@/hooks/data/trials'
import { Suspense } from 'react'
import TrialView from './trial-view'

export default function TrialsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const trials = await getTrials()
  return <TrialView trials={trials} />
}
