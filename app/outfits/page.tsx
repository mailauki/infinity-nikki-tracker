import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from '@/components/outfits/outfit-toolbar'
import FilterOutfits from '@/components/outfits/filter-outfits'
import OutfitsLoading from './loading'

export const metadata: Metadata = {
  title: 'Outfits',
}

export default function OutfitsPage() {
  return (
    <>
      <OutfitToolBar />
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfits />
      </Suspense>
    </>
  )
}
