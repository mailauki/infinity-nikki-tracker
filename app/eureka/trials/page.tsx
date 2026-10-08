import { Suspense } from 'react'
import { Metadata } from 'next'

import TrialsContent from './trials-content'
import TrialsToolBar from './trials-toolbar'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/eureka/trials'),
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
