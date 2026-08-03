'use client'

import { MomoCloakRaw } from '@/lib/types/momo'
import ListRow from '../list-row'
import { AdminList } from '../admin-list'

interface MomoCloakListProps {
  rows: MomoCloakRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function MomoCloakList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: MomoCloakListProps) {
  return (
    <AdminList
      addHref="/admin/momo-cloaks/new"
      getKey={(cloak) => cloak.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/momo-cloaks"
          slug={row.slug ?? undefined}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Momo's Cloak"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
