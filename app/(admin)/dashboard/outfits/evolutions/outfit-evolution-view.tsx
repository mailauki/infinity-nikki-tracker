'use client'

import { useDashboardView } from '../../dashboard-view-context'
import { Evolution } from '@/lib/types/outfit'
import { OutfitEvolutionTable } from './outfit-evolution-table'
import OutfitEvolutionList from './outfit-evolution-list'
import TableContainer from '../../table-container'

export default function OutfitEvolutionView({ evolutions }: { evolutions: Evolution[] }) {
  const { view } = useDashboardView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitEvolutionTable rows={evolutions} />
    </TableContainer>
  ) : (
    <OutfitEvolutionList rows={evolutions} />
  )
}
