'use client'

import { useAdminView } from '../../admin-view-context'
import { SeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import { OutfitSeasonCategoryTable } from './outfit-season-category-table'
import OutfitSeasonCategoryList from './outfit-season-category-list'
import TableContainer from '../../table-container'

export default function OutfitSeasonCategoryView({
  categories,
}: {
  categories: SeasonCategoryRaw[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitSeasonCategoryTable rows={categories} />
    </TableContainer>
  ) : (
    <OutfitSeasonCategoryList rows={categories} />
  )
}
