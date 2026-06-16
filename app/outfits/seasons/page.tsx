import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from '@/components/outfits/outfit-toolbar'
import FilterOutfitsBySeason from '@/components/outfits/filter-outfits-by-season'
import OutfitsLoading from '../loading'
import { getSeasons } from '@/hooks/data/seasons'

export const metadata: Metadata = {
  title: 'Outfits by Season',
}

export default async function SeasonsPage() {
  const seasons = await getSeasons()

  return (
    <>
      <OutfitToolBar baseEvolutionOnly showFilters={false} />
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfitsBySeason seasons={seasons} />
      </Suspense>
    </>
  )
}
