import { Suspense } from 'react'
import AddEurekaVariantForm from '@/components/forms/eureka-variant/add-eureka-variant-form'
import { getAdminData } from '@/hooks/data/user'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Eureka Variant',
}

export default function NewEurekaVariantPage() {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <NewEurekaVariant />
        </Stack>
      </Container>
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
