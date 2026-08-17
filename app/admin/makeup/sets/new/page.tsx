import { Suspense } from 'react'
import AddMakeupSetForm from './add-makeup-set-form'
import { getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getStyles } from '@/hooks/data/styles'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/makeup/sets/new'),
}

export default function NewMakeupSetPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewMakeupSet />
      </Stack>
    </Suspense>
  )
}

async function NewMakeupSet() {
  const [makeupSets, outfitSets, styles, seasons, seasonCategories, makeupCategories] =
    await Promise.all([
      getMakeupSetsRaw(),
      getOutfitSetsRaw(),
      getStyles(),
      getSeasons(),
      getSeasonCategories(),
      getMakeupCategories(),
    ])

  return (
    <AddMakeupSetForm
      makeupCategories={makeupCategories}
      makeupSets={makeupSets}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}
