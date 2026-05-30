'use client'

import { EurekaVariantRaw } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

interface EurekaVariantListProps {
  rows: EurekaVariantRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function EurekaVariantList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: EurekaVariantListProps) {
  return (
    <AdminList
			addHref={navLinksData.dashboard.eureka.variants.add}
      getKey={(variant) => variant.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="eureka/variants"
          slug={row.slug ?? undefined}
          subheader={
            [toTitle(row.category!), toTitle(row.color!)].filter(Boolean).join(' • ') || undefined
          }
          title={toTitle(row.eureka_set!) ?? '—'}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Eureka Variant"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
