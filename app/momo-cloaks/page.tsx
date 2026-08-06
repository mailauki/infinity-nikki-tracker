import { Metadata } from 'next'

import PageShell from '@/components/page-shell'

import FilterMomoCloaks from './filter-momo-cloaks'
import MomoCloakResultsBar from './momo-cloak-results-bar'
import MomoCloakToolBar from './momo-cloak-toolbar'

export const metadata: Metadata = {
  title: "Momo's Cloaks",
}

export default function MomoCloaksPage() {
  return (
    <>
      <MomoCloakToolBar />
      <MomoCloakResultsBar />
      <PageShell>
        <FilterMomoCloaks />
      </PageShell>
    </>
  )
}
