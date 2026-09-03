'use client'

import { LocationRaw } from '@/hooks/data/admin/locations'
import ListRow from '../list-row'
import { AdminList } from '../admin-list'
import { navLinksData } from '@/lib/nav-links'

interface LocationListProps {
  rows: LocationRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function LocationList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: LocationListProps) {
  return (
    <AdminList
      addHref={navLinksData.admin.locations.locations.add}
      getKey={(location) => location.slug}
      page={page}
      renderRow={(row) => (
        // `locations` has no image_url column, so every row falls back to
        // ListRow's icon placeholder.
        <ListRow list="admin/locations" slug={row.slug} title={row.title} updated_at={null} />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Location"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
