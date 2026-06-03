'use client'

import { useDashboardView } from '../../dashboard-view-context'
import { Trial } from '@/lib/types/eureka'
import { TrialTable } from './trial-table'
import TrialList from './trial-list'
import TableContainer from '../../table-container'

export default function TrialView({ trials }: { trials: Trial[] }) {
  const { view } = useDashboardView()

  return view === 'table' ? (
    <TableContainer>
      <TrialTable rows={trials} />
    </TableContainer>
  ) : (
    <TrialList rows={trials} />
  )
}
