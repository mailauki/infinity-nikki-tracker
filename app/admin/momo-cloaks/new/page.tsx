import { Suspense } from 'react'
import AddMomoCloakForm from './add-momo-cloak-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getLocations } from '@/hooks/data/locations'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Add Momo's Cloak",
}

export default function NewMomoCloakPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewMomoCloak />
      </Stack>
    </Suspense>
  )
}

async function NewMomoCloak() {
  const [styles, labels, seasons, seasonCategories, locations] = await Promise.all([
    getStyles(),
    getLabels(),
    getSeasons(),
    getSeasonCategories(),
    getLocations(),
  ])

  return (
    <AddMomoCloakForm
      labels={labels}
      locations={locations}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}
