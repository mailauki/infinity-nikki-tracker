'use client'

import { Evolution } from '@/lib/types/outfit'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'

interface OutfitEvolutionListProps {
  rows: Evolution[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitEvolutionList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitEvolutionListProps) {
  return (
    <AdminList
      getKey={(evo) => evo.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/evolutions"
          slug={row.slug}
          subheader={`${row.base_set ?? ''} — order ${row.order}`}
          title={row.title}
          updated_at={null}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Evolution"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
