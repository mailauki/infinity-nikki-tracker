import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { Metadata } from 'next'
import FilterEureka from '@/components/filter-eureka'

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
  const seen = new Set<string>()
  const categories = eurekaSets
    .flatMap((eurekaSet) => eurekaSet.categories)
    .filter((cat) => !seen.has(cat.title) && seen.add(cat.title))
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  return <FilterEureka eurekaSets={eurekaSets} categories={categories} isLoggedIn={isLoggedIn} />
}
