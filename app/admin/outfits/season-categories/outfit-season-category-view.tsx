'use client'

import { useMemo } from 'react'
import { useAdminView } from '../../admin-view-context'
import { SeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import { SeasonGroupRaw } from '@/hooks/data/admin/season-groups'
import { OutfitSeasonCategoryTable } from './outfit-season-category-table'
import OutfitSeasonCategoryList from './outfit-season-category-list'
import TableContainer from '../../table-container'

export default function OutfitSeasonCategoryView({
  categories,
  seasonGroups,
}: {
  categories: SeasonCategoryRaw[]
  seasonGroups: SeasonGroupRaw[]
}) {
  const { view } = useAdminView()

  // `season_category.season_group` stores the group's slug; the list and table
  // both show its human title, so resolve it once here.
  const groupTitles = useMemo(
    () => new Map(seasonGroups.map((group) => [group.slug, group.title])),
    [seasonGroups]
  )

  return view === 'table' ? (
    <TableContainer>
      <OutfitSeasonCategoryTable groupTitles={groupTitles} rows={categories} />
    </TableContainer>
  ) : (
    <OutfitSeasonCategoryList groupTitles={groupTitles} rows={categories} />
  )
}
