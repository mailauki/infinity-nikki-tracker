import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import EntityForm from '@/app/admin/entity-form'
import { addLocation } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/locations/new'),
}

export default function NewLocationPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EntityForm
          showAddAnother
          action={addLocation}
          formId="add-location"
          formKind="location"
          mode="add"
        />
      </Stack>
    </Suspense>
  )
}
