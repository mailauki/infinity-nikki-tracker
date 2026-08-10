'use client'

import { useAdminView } from '../../admin-view-context'
import { Style } from '@/lib/types/eureka'
import { MakeupSetRaw } from '@/lib/types/makeup'
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { MakeupSetTable } from './makeup-set-table'
import MakeupSetList from './makeup-set-list'
import TableContainer from '../../table-container'

export default function MakeupSetView({
  makeupSets,
  outfitSets,
  styles,
  seasons,
  seasonCategories,
}: {
  makeupSets: MakeupSetRaw[]
  outfitSets: OutfitSetRaw[]
  styles: Style[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <MakeupSetTable
        outfitSets={outfitSets}
        rows={makeupSets}
        seasonCategories={seasonCategories}
        seasons={seasons}
        styles={styles}
      />
    </TableContainer>
  ) : (
    <MakeupSetList rows={makeupSets} />
  )
}
