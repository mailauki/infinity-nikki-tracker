import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import EntityForm from '@/app/admin/entity-form'
import { addMakeupVariant } from '../actions'

export const metadata: Metadata = {
  title: 'Add Makeup Variant',
}

export default function NewMakeupVariantPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewMakeupVariant />
      </Stack>
    </Suspense>
  )
}

async function NewMakeupVariant() {
  const [makeupSets, makeupCategories, styles, labels] = await Promise.all([
    getMakeupSetsRaw(),
    getMakeupCategories(),
    getStyles(),
    getLabels(),
  ])

  return (
    <EntityForm
      showAddAnother
      action={addMakeupVariant}
      formId="add-makeup-variant"
      formKind="makeupVariant"
      lookups={{ makeupSets, makeupCategories, styles, labels }}
      mode="add"
    />
  )
}
