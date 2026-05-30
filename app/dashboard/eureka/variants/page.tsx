import { getCategories } from '@/hooks/data/categories'
import { getColors } from '@/hooks/data/colors'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getEurekaVariantsRaw } from '@/hooks/data/admin/eureka-variants'
import { Suspense } from 'react'
import EurekaVariantView from './eureka-variant-view'

export default function EurekaVariantsDashboard() {
  return (
    <Suspense>
      <DataTable />
    </Suspense>
  )
}

async function DataTable() {
  const [eurekaVariants, eurekaSets, categories, colors] = await Promise.all([
    getEurekaVariantsRaw(),
    getEurekaSets(),
    getCategories(),
    getColors(),
  ])

  return (
    <EurekaVariantView
      categories={categories}
      colors={colors}
      eurekaSets={eurekaSets}
      eurekaVariants={eurekaVariants}
    />
  )
}
