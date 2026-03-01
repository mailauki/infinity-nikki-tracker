import { Suspense } from 'react'
import { Container } from '@mui/material'
import { getEurekaVariants } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import { toSlugVariant } from '@/lib/utils'
import { EurekaVariantTable } from '@/components/admin/eureka-variant-table'

export default function EurekaVariantPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <EurekaVariantLoader />
      </Container>
    </Suspense>
  )
}

async function EurekaVariantLoader() {
  const eurekaVariants = await getEurekaVariants()

  const nullSlugVariants = eurekaVariants?.filter((v) => !v.slug) ?? []
  if (nullSlugVariants.length > 0) {
    const supabase = await createClient()
    await Promise.all(
      nullSlugVariants.map((variant) =>
        supabase
          .from('eureka_variants')
          .update({
            slug: toSlugVariant(
              variant.eureka_set ?? '',
              variant.category ?? '',
              variant.color ?? ''
            ),
          })
          .eq('id', variant.id)
      )
    )
  }

  return <EurekaVariantTable rows={eurekaVariants ?? []} />
}
