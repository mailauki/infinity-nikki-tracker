import { Suspense } from 'react'
import { Metadata } from 'next'
import FilterEureka from './filter-eureka'
import EurekaLoading from './loading'
import EurekaToolBar from './eureka-toolbar'
import EurekaResultsBar from './eureka-results-bar'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/eureka'),
}

export default function EurekaSetsPage() {
  return (
    <>
      <EurekaToolBar />
      <EurekaResultsBar />
      <PageShell>
        <Suspense fallback={<EurekaLoading />}>
          <FilterEureka />
        </Suspense>
      </PageShell>
    </>
  )
}
