import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import EntityForm from '@/app/admin/entity-form'
import { addSeasonCategory } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/season-categories/new'),
}

export default function NewSeasonCategoryPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EntityForm
          showAddAnother
          action={addSeasonCategory}
          formId="add-season-category"
          formKind="seasonCategory"
          mode="add"
        />
      </Stack>
    </Suspense>
  )
}
