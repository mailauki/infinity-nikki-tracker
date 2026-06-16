import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getLocations } from '@/hooks/data/locations'
import AddSeasonForm from './add-season-form'

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

  return <AddSeasonForm locations={locations} />
}
