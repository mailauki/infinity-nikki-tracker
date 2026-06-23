'use client'

import { useAdminView } from '../../admin-view-context'
import { Evolution, OutfitCategory } from '@/lib/types/outfit'
import { evolutionSortKey } from '@/hooks/outfit'
import { OutfitEvolutionTable } from './outfit-evolution-table'
import OutfitEvolutionList from './outfit-evolution-list'
import TableContainer from '../../table-container'

export default function OutfitEvolutionView({
  evolutions,
  outfitCategories,
}: {
  evolutions: Evolution[]
  outfitCategories: OutfitCategory[]
}) {
  const { view } = useAdminView()

  // getEvolutions already filters to base_set IS NOT NULL — no base rows here.
  // Sort by base-set title then evolution order so the table matches the list view.
  const rows = [...evolutions].sort(
    (a, b) =>
      (a.base_set ?? '').localeCompare(b.base_set ?? '') ||
      evolutionSortKey(a) - evolutionSortKey(b)
  )

  return view === 'table' ? (
    <TableContainer>
      <OutfitEvolutionTable outfitCategories={outfitCategories} rows={rows} />
    </TableContainer>
  ) : (
    <OutfitEvolutionList rows={rows} />
  )
}
