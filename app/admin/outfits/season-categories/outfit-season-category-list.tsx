'use client'

import { SeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'
import { navLinksData } from '@/lib/nav-links'
import { toTitle } from '@/lib/utils'

interface OutfitSeasonCategoryListProps {
  rows: SeasonCategoryRaw[]
  /** Season-group slug -> title, for the row subtitle. */
  groupTitles: Map<string, string>
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitSeasonCategoryList({
  rows,
  groupTitles,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitSeasonCategoryListProps) {
  return (
    <AdminList
      addHref={navLinksData.admin.outfits.seasonCategories.add}
      getKey={(category) => category.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/season-categories"
          slug={row.slug}
          subheader={
            row.season_group
              ? (groupTitles.get(row.season_group) ?? toTitle(row.season_group))
              : undefined
          }
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
