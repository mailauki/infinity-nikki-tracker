'use client'

import { MakeupVariantRaw } from '@/lib/types/makeup'
import ListRow from '../../list-row'
import { toTitle } from '@/lib/utils'
import { AdminList } from '../../admin-list'

interface MakeupVariantListProps {
  rows: MakeupVariantRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function MakeupVariantList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: MakeupVariantListProps) {
  return (
    <AdminList
      addHref="/admin/makeup/variants/new"
      getKey={(variant) => variant.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/makeup/variants"
          slug={row.slug ?? undefined}
          subheader={
            [
              row.makeup_sets?.title ?? (row.makeup_set ? toTitle(row.makeup_set) : null),
              row.makeup_categories?.title ??
                (row.makeup_category ? toTitle(row.makeup_category) : null),
            ]
              .filter(Boolean)
              .join(' • ') || undefined
          }
          title={row.title ?? toTitle(row.slug) ?? '—'}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Makeup Variant"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
