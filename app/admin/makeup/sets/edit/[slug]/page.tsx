import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditMakeupSetForm from './edit-makeup-set-form'
import { getMakeupSetRaw, getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Makeup Set',
}

export default async function EditMakeupSetPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditMakeupSet params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditMakeupSet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [makeupSet, makeupSets, outfitSets, styles, labels, seasons, seasonCategories] =
    await Promise.all([
      getMakeupSetRaw(slug),
      getMakeupSetsRaw(),
      getOutfitSetsRaw(),
      getStyles(),
      getLabels(),
      getSeasons(),
      getSeasonCategories(),
    ])

  if (!makeupSet) notFound()

  return (
    <EditMakeupSetForm
      initial={makeupSet}
      labels={labels}
      makeupSets={makeupSets}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}
