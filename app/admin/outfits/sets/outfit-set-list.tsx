'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { AdminList } from '../../admin-list'
import ListRow from '../../list-row'
import { navLinksData } from '@/lib/nav-links'

interface OutfitSetListProps {
  rows: OutfitSet[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitSetList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitSetListProps) {
  return (
    <AdminList
      addHref={navLinksData.dashboard.outfits.sets.add}
      getKey={(set) => set.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/sets"
          slug={row.slug ?? undefined}
          subheader={row.evolutions?.map((e) => e.subtitle).join(', ') || '—'}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Outfit Set"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
