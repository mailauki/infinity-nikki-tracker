import AddTrialForm from './add-trial-form'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { getLocations } from '@/hooks/data/locations'

export const metadata: Metadata = {
  title: 'Add Trial',
}

export default function NewTrialPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewTrial />
      </Stack>
    </Suspense>
  )
}

async function NewTrial() {
  const locations = await getLocations()

  return <AddTrialForm locations={locations} />
}
