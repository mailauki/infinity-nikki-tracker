import { Suspense } from 'react'
import { Metadata } from 'next'

import TrialsContent from './trials-content'
import TrialsToolBar from './trials-tool-bar'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Trials',
}

export default function TrialsPage() {
  return (
    <>
      <TrialsToolBar />
      <PageShell>
        <Suspense>
          <TrialsContent />
        </Suspense>
      </PageShell>
    </>
  )
}
