import { Suspense } from 'react'

import { Metadata } from 'next'
import FilterEureka from '@/components/eureka/filter/filter-eureka'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default function EurekaSetsPage() {
  return (
    <Suspense>
      <FilterEureka />
    </Suspense>
  )
}

