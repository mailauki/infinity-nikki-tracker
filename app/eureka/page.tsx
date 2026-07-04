import { Suspense } from 'react'
import { Metadata } from 'next'
import FilterEureka from './filter-eureka'
import EurekaLoading from './loading'
import EurekaToolBar from './eureka-toolbar'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default function EurekaSetsPage() {
  return (
    <>
      <EurekaToolBar />
      <PageShell>
        <Suspense fallback={<EurekaLoading />}>
          <FilterEureka />
        </Suspense>
      </PageShell>
    </>
  )
}
