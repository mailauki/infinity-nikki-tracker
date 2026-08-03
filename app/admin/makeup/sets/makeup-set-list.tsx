'use client'

import { MakeupSetRaw } from '@/lib/types/makeup'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'

interface MakeupSetListProps {
  rows: MakeupSetRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function MakeupSetList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: MakeupSetListProps) {
  return (
    <AdminList
      addHref="/admin/makeup/sets/new"
      getKey={(set) => set.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/makeup/sets"
          slug={row.slug ?? undefined}
          subheader={row.base_set ? `Evolution of ${row.base_set}` : 'Base set'}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Makeup Set"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
