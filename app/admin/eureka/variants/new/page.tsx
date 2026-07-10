import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getAdminData } from '@/hooks/data/user'
import EntityForm from '@/app/admin/entity-form'
import { addEurekaVariant } from '../actions'

export const metadata: Metadata = {
  title: 'Add Eureka Variant',
}

export default function NewEurekaVariantPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewEurekaVariant />
      </Stack>
    </Suspense>
  )
}

async function NewEurekaVariant() {
  const { eurekaSets, categories, colors, eurekaVariants } = await getAdminData()

  return (
    <EntityForm
      showAddAnother
      action={addEurekaVariant}
      builderData={{ eurekaVariants: eurekaVariants ?? [] }}
      formId="add-eureka-variant"
      formKind="eurekaVariant"
      lookups={{
        eurekaSets: eurekaSets ?? [],
        categories: categories ?? [],
        colors: colors ?? [],
      }}
      mode="add"
    />
  )
}
