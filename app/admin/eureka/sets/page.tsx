import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getLabels } from '@/hooks/data/labels'
import { getStyles } from '@/hooks/data/styles'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import EurekaSetView from './eureka-set-view'

export default function EurekaSetsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [eurekaSets, styles, labels] = await Promise.all([
    getEurekaSets(),
    getStyles(),
    getLabels(),
  ])

  const sortedEurekaSets = [...eurekaSets].sort(byTitleThenSlug)

  return <EurekaSetView eurekaSets={sortedEurekaSets} labels={labels} styles={styles} />
}
