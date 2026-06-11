import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from '@/components/outfits/outfit-toolbar'
import FilterOutfits from '@/components/outfits/filter-outfits'
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
        Images are currently being uploaded
      </Alert>
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfits />
      </Suspense>
    </>
  )
}
