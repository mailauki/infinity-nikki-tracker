import { Suspense } from 'react'
import { Metadata } from 'next'
import MakeupToolBar from './makeup-toolbar'
import MakeupResultsBar from './makeup-results-bar'
import FilterMakeup from './filter-makeup'
import MakeupLoading from './loading'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Makeup',
}

export default function MakeupPage() {
  return (
    <>
      <MakeupToolBar />
      <MakeupResultsBar />
      <PageShell>
        <Suspense fallback={<MakeupLoading />}>
          <FilterMakeup />
        </Suspense>
      </PageShell>
    </>
  )
}
