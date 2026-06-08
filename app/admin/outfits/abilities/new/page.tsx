import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import AddAbilityForm from './add-ability-form'

export const metadata: Metadata = {
  title: 'Add Ability',
}

export default function NewAbilityPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <AddAbilityForm />
      </Stack>
    </Suspense>
  )
}
