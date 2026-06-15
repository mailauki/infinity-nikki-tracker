'use client'

import { useAdminView } from '../../admin-view-context'
import { SeasonRaw } from '@/hooks/data/admin/seasons'
import { OutfitSeasonTable } from './outfit-season-table'
import OutfitSeasonList from './outfit-season-list'
import TableContainer from '../../table-container'

export default function OutfitSeasonView({ seasons }: { seasons: SeasonRaw[] }) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitSeasonTable rows={seasons} />
    </TableContainer>
  ) : (
    <OutfitSeasonList rows={seasons} />
  )
}
