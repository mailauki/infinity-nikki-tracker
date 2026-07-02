import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getLocations } from '@/hooks/data/locations'
import EntityForm from '@/app/admin/entity-form'
import { addSeason } from './actions'

export const metadata: Metadata = {
  title: 'Add Season',
}

export default function NewSeasonPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewSeason />
      </Stack>
    </Suspense>
  )
}

async function NewSeason() {
  const locations = await getLocations()

  return (
    <EntityForm
      showAddAnother
      action={addSeason}
      backUrl={navLinksData.admin.outfits.seasons.list}
      formId="add-season"
      formKind="season"
      lookups={{ locations }}
      mode="add"
    />
  )
}
