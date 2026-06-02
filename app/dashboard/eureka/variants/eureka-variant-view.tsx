'use client'

import { useDashboardView } from '../../dashboard-view-context'
import { EurekaCategory, EurekaColor, EurekaSet, EurekaVariantRaw } from '@/lib/types/eureka'
import { EurekaVariantTable } from '../../eureka-variant-table'
import EurekaVariantList from '../../eureka-variant-list'
import TableContainer from '../../table-container'

export default function EurekaVariantView({
  eurekaVariants,
  eurekaSets,
  categories,
  colors,
}: {
  eurekaVariants: EurekaVariantRaw[]
  eurekaSets: EurekaSet[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
}) {
  const { view } = useDashboardView()

  return view === 'table' ? (
    <TableContainer>
      <EurekaVariantTable
        categories={categories}
        colors={colors}
        eurekaSets={eurekaSets}
        rows={eurekaVariants}
      />
    </TableContainer>
  ) : (
    <EurekaVariantList rows={eurekaVariants} />
  )
}
