'use client'

import { Evolution } from '@/lib/types/outfit'
import { AdminList } from '../../admin-list'
import ListRow from '../../list-row'

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
          subheader={row.order.toString() ?? undefined}
          title={row.subtitle ? `${row.title}: ${row.subtitle}` : row.title}
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
