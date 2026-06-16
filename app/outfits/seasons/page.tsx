import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from '@/components/outfits/outfit-toolbar'
import FilterOutfitsBySeason from '@/components/outfits/filter-outfits-by-season'
import OutfitsLoading from '../loading'

export const metadata: Metadata = {
  title: 'Outfits by Season',
}

export default function SeasonsPage() {
  return (
    <>
      <OutfitToolBar />
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfitsBySeason />
      </Suspense>
    </>
  )
}
