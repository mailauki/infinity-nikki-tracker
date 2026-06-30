'use client'

import { useAdminView } from '../../admin-view-context'
import { OutfitCategory, OutfitSetRaw, OutfitVariantRaw } from '@/lib/types/outfit'
import { OutfitVariantTable } from './outfit-variant-table'
import OutfitVariantList from './outfit-variant-list'
import TableContainer from '../../table-container'

export default function OutfitVariantView({
  outfitVariants,
  outfitSets,
  outfitCategories,
}: {
  outfitVariants: OutfitVariantRaw[]
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitVariantTable
        outfitCategories={outfitCategories}
        outfitSets={outfitSets}
        rows={outfitVariants}
      />
    </TableContainer>
  ) : (
    <OutfitVariantList rows={outfitVariants} />
  )
}
