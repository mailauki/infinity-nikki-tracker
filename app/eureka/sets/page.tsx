import { Suspense } from 'react'
import { Metadata } from 'next'

import SetsContent from './sets-content'
import TrialsToolBar from '@/app/eureka/trials/trials-tool-bar'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default function EurekaSetsPage() {
  return (
    <>
      <TrialsToolBar />
      <PageShell>
        <Suspense>
          <SetsContent />
        </Suspense>
      </PageShell>
    </>
  )
}
