'use client'

import { useAdminView } from '../../admin-view-context'
import { Ability, OutfitCategory, OutfitSet } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { OutfitSetTable } from './outfit-set-table'
import OutfitSetList from './outfit-set-list'
import TableContainer from '../../table-container'

export default function OutfitSetView({
  outfitSets,
  styles,
  labels,
  abilities,
  outfitCategories,
}: {
  outfitSets: OutfitSet[]
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  outfitCategories: OutfitCategory[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitSetTable
        abilities={abilities}
        labels={labels}
        outfitCategories={outfitCategories}
        rows={outfitSets}
        styles={styles}
      />
    </TableContainer>
  ) : (
    <OutfitSetList rows={outfitSets} />
  )
}
