'use client'

import { useAdminView } from '../../admin-view-context'
import { Evolution } from '@/lib/types/outfit'
import { OutfitEvolutionTable } from './outfit-evolution-table'
import OutfitEvolutionList from './outfit-evolution-list'
import TableContainer from '../../table-container'

export default function OutfitEvolutionView({ evolutions }: { evolutions: Evolution[] }) {
  const { view } = useAdminView()

  // The {set}-base row is not a selectable evolution — its image lives on the
  // outfit set row, so editing it here would silently no-op in the UI. Exclude
  // base from the admin list/table so it never shows a misleading image control.
  const rows = evolutions.filter((e) => e.subtitle !== 'base')

  return view === 'table' ? (
    <TableContainer>
      <OutfitEvolutionTable rows={rows} />
    </TableContainer>
  ) : (
    <OutfitEvolutionList rows={rows} />
  )
}
