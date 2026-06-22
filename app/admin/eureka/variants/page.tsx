import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getEurekaVariantsRaw } from '@/hooks/data/admin/eureka-variants'
import { bySlug } from '@/lib/utils'
import { Suspense } from 'react'
import EurekaVariantView from './eureka-variant-view'

export default function EurekaVariantsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [eurekaVariants, eurekaSets, categories, colors] = await Promise.all([
    getEurekaVariantsRaw(),
    getEurekaSets(),
    getEurekaCategories(),
    getEurekaColors(),
  ])

  const sortedEurekaVariants = [...eurekaVariants].sort(bySlug)

  return (
    <EurekaVariantView
      categories={categories}
      colors={colors}
      eurekaSets={eurekaSets}
      eurekaVariants={sortedEurekaVariants}
    />
  )
}
