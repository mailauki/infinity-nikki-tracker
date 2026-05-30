import { Suspense } from 'react'
import { Metadata } from 'next'
import FilterEureka from '@/components/eureka/filter/filter-eureka'
import EurekaResultsBar from '@/components/eureka/filter/eureka-results-bar'
import EurekaLoading from './loading'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default function EurekaSetsPage() {
  return (
    <>
      <EurekaResultsBar />
      <Suspense fallback={<EurekaLoading />}>
        <FilterEureka />
      </Suspense>
    </>
  )
}
