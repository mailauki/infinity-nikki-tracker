import { Suspense } from 'react'
import { Metadata } from 'next'
import OutfitToolBar from '@/components/outfits/outfit-toolbar'
import FilterOutfitsBySeason from '@/components/outfits/filter-outfits-by-season'
import OutfitsLoading from '../loading'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'

export const metadata: Metadata = {
  title: 'Outfits by Season',
}

export default async function SeasonsPage() {
  const [seasons, seasonCategories] = await Promise.all([getSeasons(), getSeasonCategories()])

  return (
    <>
      <OutfitToolBar baseEvolutionOnly showFilters={false} />
      <Suspense fallback={<OutfitsLoading />}>
        <FilterOutfitsBySeason seasonCategories={seasonCategories} seasons={seasons} />
      </Suspense>
    </>
  )
}
