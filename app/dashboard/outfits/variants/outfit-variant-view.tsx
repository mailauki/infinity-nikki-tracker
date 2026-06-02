'use client'

import { useDashboardView } from '../../dashboard-view-context'
import { Evolution, OutfitCategory, OutfitSet, OutfitVariantRaw } from '@/lib/types/outfit'
import { OutfitVariantTable } from '../../outfit-variant-table'
import OutfitVariantList from '../../outfit-variant-list'
import TableContainer from '../../table-container'

export default function OutfitVariantView({
  outfitVariants,
  outfitSets,
  outfitCategories,
  evolutions,
}: {
  outfitVariants: OutfitVariantRaw[]
  outfitSets: OutfitSet[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
}) {
  const { view } = useDashboardView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitVariantTable
        evolutions={evolutions}
        outfitCategories={outfitCategories}
        outfitSets={outfitSets}
        rows={outfitVariants}
      />
    </TableContainer>
  ) : (
    <OutfitVariantList rows={outfitVariants} />
  )
}
