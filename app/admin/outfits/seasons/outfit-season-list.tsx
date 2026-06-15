'use client'

import { SeasonRaw } from '@/hooks/data/admin/seasons'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'

interface OutfitSeasonListProps {
  rows: SeasonRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitSeasonList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitSeasonListProps) {
  return (
    <AdminList
      getKey={(season) => season.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          list="admin/outfits/seasons"
          slug={row.slug}
          title={row.title}
          updated_at={null}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Season"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
