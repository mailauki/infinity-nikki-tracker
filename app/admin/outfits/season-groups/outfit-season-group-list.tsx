'use client'

import { SeasonGroupRaw } from '@/hooks/data/admin/season-groups'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'

interface OutfitSeasonGroupListProps {
  rows: SeasonGroupRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitSeasonGroupList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitSeasonGroupListProps) {
  return (
    <AdminList
      getKey={(group) => group.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/season-groups"
          slug={row.slug}
          title={row.title}
          updated_at={null}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Season Group"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
