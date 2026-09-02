import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import EntityForm from '@/app/admin/entity-form'
import { getSeasonGroupsRaw } from '@/hooks/data/admin/season-groups'
import { addSeasonCategory } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/season-categories/new'),
}

export default function NewSeasonCategoryPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewSeasonCategoryForm />
      </Stack>
    </Suspense>
  )
}

async function NewSeasonCategoryForm() {
  const seasonGroups = await getSeasonGroupsRaw()

  return (
    <EntityForm
      showAddAnother
      action={addSeasonCategory}
      formId="add-season-category"
      formKind="seasonCategory"
      lookups={{ seasonGroups }}
      mode="add"
    />
  )
}
