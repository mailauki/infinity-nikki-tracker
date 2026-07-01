import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import EntityForm from '@/app/admin/entity-form'
import { abilityFields } from '../fields'
import { addAbility } from './actions'

export const metadata: Metadata = {
  title: 'Add Ability',
}

export default function NewAbilityPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EntityForm
          showAddAnother
          action={addAbility}
          backUrl={navLinksData.admin.outfits.abilities.list}
          fields={abilityFields('add')}
          formId="add-ability"
          mode="add"
        />
      </Stack>
    </Suspense>
  )
}
