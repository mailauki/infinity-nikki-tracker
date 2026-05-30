import { Suspense } from 'react'
import { Metadata } from 'next'
import FilterEureka from '@/components/eureka/filter/filter-eureka'
import EurekaLoading from './loading'
import EurekaToolBar from '@/components/eureka/filter/eureka-tool-bar'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default function EurekaSetsPage() {
  return (
    <>
      <EurekaToolBar />
      <Suspense fallback={<EurekaLoading />}>
        <FilterEureka />
      </Suspense>
    </>
  )
}
