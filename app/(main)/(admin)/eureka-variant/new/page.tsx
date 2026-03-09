import { Suspense } from 'react'
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
  const { eurekaSets, categories, colors, eurekaVariants } = await getAdminData()

  return (
    <AddEurekaVariantForm
      eurekaSets={eurekaSets ?? []}
      categories={categories ?? []}
      colors={colors ?? []}
      variants={eurekaVariants ?? []}
    />
  )
}
