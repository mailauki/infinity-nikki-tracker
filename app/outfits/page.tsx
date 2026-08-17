import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from './outfit-toolbar'
import OutfitResultsBar from './outfit-results-bar'
import FilterOutfits from './filter-outfits'
import OutfitsLoading from './loading'
import { Alert } from '@mui/material'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/outfits'),
}

export default function OutfitsPage() {
  return (
    <>
      <OutfitToolBar />
      <OutfitResultsBar />
      <PageShell>
        <Alert severity="info">Images are currently being uploaded — please be patient</Alert>
        <Suspense fallback={<OutfitsLoading />}>
          <FilterOutfits />
        </Suspense>
      </PageShell>
    </>
  )
}
