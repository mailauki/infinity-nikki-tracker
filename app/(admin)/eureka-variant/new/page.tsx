import { Suspense } from 'react'
import AddEurekaVariantForm from './add-eureka-variant-form'
import { getAdminData } from '@/hooks/data/user'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

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
    <AddEurekaVariantForm
      categories={categories ?? []}
      colors={colors ?? []}
      eurekaSets={eurekaSets ?? []}
      variants={eurekaVariants ?? []}
    />
  )
}
