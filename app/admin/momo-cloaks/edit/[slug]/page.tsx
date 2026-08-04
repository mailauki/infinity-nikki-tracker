import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditMomoCloakForm from './edit-momo-cloak-form'
import { getMomoCloakRaw } from '@/hooks/data/admin/momo-cloaks'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getLocations } from '@/hooks/data/locations'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Edit Momo's Cloak",
}

export default async function EditMomoCloakPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditMomoCloak params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditMomoCloak({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [momoCloak, styles, labels, seasons, seasonCategories, locations, outfitSets] =
    await Promise.all([
      getMomoCloakRaw(slug),
      getStyles(),
      getLabels(),
      getSeasons(),
      getSeasonCategories(),
      getLocations(),
      getOutfitSetsRaw(),
    ])

  if (!momoCloak) notFound()

  return (
    <EditMomoCloakForm
      initial={momoCloak}
      labels={labels}
      locations={locations}
      outfitSets={outfitSets}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}
