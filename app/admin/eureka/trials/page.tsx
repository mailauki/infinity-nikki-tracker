import { getTrials } from '@/hooks/data/trials'
import { getLocations } from '@/hooks/data/locations'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import TrialView from './trial-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/eureka/trials') }

export default function TrialsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [trials, locations] = await Promise.all([getTrials(), getLocations()])
  const sortedTrials = [...trials].sort(byTitleThenSlug)
  return <TrialView locations={locations} trials={sortedTrials} />
}
