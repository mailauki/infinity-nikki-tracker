import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from './outfit-toolbar'
import FilterOutfits from './filter-outfits'
import OutfitsLoading from './loading'
import { Alert } from '@mui/material'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Outfits',
}

export default function OutfitsPage() {
  return (
    <>
      <OutfitToolBar />
      <PageShell>
        <Alert severity="info">Images are currently being uploaded — please be patient</Alert>
        <Suspense fallback={<OutfitsLoading />}>
          <FilterOutfits />
        </Suspense>
      </PageShell>
    </>
  )
}
