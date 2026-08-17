import { Suspense } from 'react'
import { Metadata } from 'next'

import SetsContent from './sets-content'
import TrialsToolBar from '@/app/eureka/trials/trials-toolbar'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/eureka/sets'),
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
