import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { getAdminData } from '@/lib/data'
import AddEurekaVariantForm from '@/components/forms/eureka-variant/add-eureka-variant-form'

export default function NewEurekaVariantPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <NewEurekaVariant />
      </Container>
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
