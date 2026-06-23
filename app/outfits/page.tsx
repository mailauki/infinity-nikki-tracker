import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from './outfit-toolbar'
import FilterOutfits from './filter-outfits'
import OutfitsLoading from './loading'
import { Alert } from '@mui/material'

export const metadata: Metadata = {
  title: 'Outfits',
}

export default function OutfitsPage() {
  return (
    <>
      <OutfitToolBar />
      <Alert severity="info" sx={{ mb: 2 }}>
        Images are currently being uploaded — please be patient
      </Alert>
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfits />
      </Suspense>
    </>
  )
}
