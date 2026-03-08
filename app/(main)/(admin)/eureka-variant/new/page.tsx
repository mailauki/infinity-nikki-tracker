import { Suspense } from 'react'
import { Box, Typography } from '@mui/material'
import AddEurekaVariantForm from '@/components/forms/eureka-variant/add-eureka-variant-form'
import { getAdminData } from '@/hooks/data/user'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Add Eureka Variant',
}

export default function NewEurekaVariantPage() {
  return (
    <Suspense>
      <PageContainer title="Add Eureka Variant" size="sm">
        <NewEurekaVariant />
      </PageContainer>
    </Suspense>
  )
}

async function NewEurekaVariant() {
  const { eurekaSets, categories, colors } = await getAdminData()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Add Eureka Variant
      </Typography>
      <AddEurekaVariantForm
        eurekaSets={eurekaSets ?? []}
        categories={categories ?? []}
        colors={colors ?? []}
      />
    </Box>
  )
}
