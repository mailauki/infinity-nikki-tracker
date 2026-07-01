import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { navLinksData } from '@/lib/nav-links'
import { getLocations } from '@/hooks/data/locations'
import EntityForm from '@/app/admin/entity-form'
import { trialFields } from '../fields'
import { addTrial } from '../actions'

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

  return (
    <EntityForm
      showAddAnother
      action={addTrial}
      backUrl={navLinksData.admin.eureka.trials.list}
      fields={trialFields('add')}
      formId="add-trial"
      lookups={{ locations }}
      mode="add"
    />
  )
}
