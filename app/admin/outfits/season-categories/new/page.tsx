import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import EntityForm from '@/app/admin/entity-form'
import { seasonCategoryFields } from '../fields'
import { addSeasonCategory } from './actions'

export const metadata: Metadata = {
  title: 'Add Season Category',
}

export default function NewSeasonCategoryPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EntityForm
          showAddAnother
          action={addSeasonCategory}
          backUrl={navLinksData.admin.outfits.seasonCategories.list}
          fields={seasonCategoryFields('add')}
          formId="add-season-category"
          mode="add"
        />
      </Stack>
    </Suspense>
  )
}
