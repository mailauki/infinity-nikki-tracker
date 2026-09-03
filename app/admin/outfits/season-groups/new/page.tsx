import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import EntityForm from '@/app/admin/entity-form'
import { addSeasonGroup } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/season-groups/new'),
}

export default function NewSeasonGroupPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EntityForm
          showAddAnother
          action={addSeasonGroup}
          formId="add-season-group"
          formKind="seasonGroup"
          mode="add"
        />
      </Stack>
    </Suspense>
  )
}
