'use client'

import { useAdminView } from '../../admin-view-context'
import { SeasonGroupRaw } from '@/hooks/data/admin/season-groups'
import { OutfitSeasonGroupTable } from './outfit-season-group-table'
import OutfitSeasonGroupList from './outfit-season-group-list'
import TableContainer from '../../table-container'

export default function OutfitSeasonGroupView({ groups }: { groups: SeasonGroupRaw[] }) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitSeasonGroupTable rows={groups} />
    </TableContainer>
  ) : (
    <OutfitSeasonGroupList rows={groups} />
  )
}
