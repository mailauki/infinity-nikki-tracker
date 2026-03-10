import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { Metadata } from 'next'
import RealtimeEureka from '@/components/realtime/realtime-eureka'
import { getObtained } from '@/hooks/data/obtained-eureka'
import { getCategories } from '@/hooks/data/categories'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default async function EurekaSetsPage() {
  return (
    <Suspense>
      <EurekaSets />
    </Suspense>
  )
}

async function EurekaSets() {
  const eurekaSets = await getEurekaSets()
  const categories = await getCategories()
  const user_id = await getUserID()
  const isLoggedIn = !!user_id
  const obtained = await getObtained(user_id!)

  return (
    <RealtimeEureka
      serverEurekaSets={eurekaSets}
      serverCategories={categories}
      isLoggedIn={isLoggedIn}
      serverObtained={obtained}
      userId={user_id}
    />
  )
}
