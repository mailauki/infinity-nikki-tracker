'use client'

import { OutfitVariantRaw } from '@/lib/types/outfit'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

interface OutfitVariantListProps {
  rows: OutfitVariantRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitVariantList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitVariantListProps) {
  return (
    <AdminList
      addHref={navLinksData.dashboard.outfits.variants.add}
      getKey={(variant) => variant.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="outfits/variants"
          slug={row.slug ?? undefined}
          subheader={
            [toTitle(row.outfit_category!), toTitle(row.evolution!)].filter(Boolean).join(' • ') ||
            undefined
          }
          title={toTitle(row.outfit_set!) ?? '—'}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Outfit Variant"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
