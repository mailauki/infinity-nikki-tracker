'use client'

import { AbilityRaw } from '@/hooks/data/admin/abilities'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'
import { navLinksData } from '@/lib/nav-links'

interface OutfitAbilityListProps {
  rows: AbilityRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitAbilityList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitAbilityListProps) {
  return (
    <AdminList
      addHref={navLinksData.admin.outfits.abilities.add}
      getKey={(ability) => ability.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/abilities"
          slug={row.slug}
          title={row.title}
          updated_at={null}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Ability"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
