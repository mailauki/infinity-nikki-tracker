import { getCategories } from '@/hooks/data/categories'
import { getColors } from '@/hooks/data/colors'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getEurekaVariantsRaw } from '@/hooks/data/admin/eureka-variants'
import { Suspense } from 'react'
import { EurekaVariantTable } from '../../eureka-variant-table'
import TableContainer from '../../table-container'

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
    <TableContainer>
      <EurekaVariantTable
        categories={categories}
        colors={colors}
        eurekaSets={eurekaSets}
        rows={eurekaVariants}
      />
    </TableContainer>
  )
}
