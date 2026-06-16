'use client'

import { useAdminView } from '../../admin-view-context'
import { Trial } from '@/lib/types/eureka'
import { Location } from '@/lib/types/outfit'
import { TrialTable } from './trial-table'
import TrialList from './trial-list'
import TableContainer from '../../table-container'

export default function TrialView({
  trials,
  locations,
}: {
  trials: Trial[]
  locations: Location[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <TrialTable locations={locations} rows={trials} />
    </TableContainer>
  ) : (
    <TrialList rows={trials} />
  )
}
