'use client'

import { SeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'

interface OutfitSeasonCategoryListProps {
  rows: SeasonCategoryRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitSeasonCategoryList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitSeasonCategoryListProps) {
  return (
    <AdminList
      getKey={(category) => category.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/season-categories"
          slug={row.slug}
          title={row.title}
          updated_at={null}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Season Category"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
