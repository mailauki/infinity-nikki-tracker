import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import EntityForm from '@/app/admin/entity-form'
import { addAbility } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/abilities/new'),
}

export default function NewAbilityPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EntityForm
          showAddAnother
          action={addAbility}
          formId="add-ability"
          formKind="ability"
          mode="add"
        />
      </Stack>
    </Suspense>
  )
}
