'use client'

import { useAdminView } from '../../admin-view-context'
import { Label, Style } from '@/lib/types/eureka'
import { MakeupSetRaw } from '@/lib/types/makeup'
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { MakeupSetTable } from './makeup-set-table'
import MakeupSetList from './makeup-set-list'
import TableContainer from '../../table-container'

export default function MakeupSetView({
  makeupSets,
  outfitSets,
  styles,
  labels,
  seasons,
  seasonCategories,
}: {
  makeupSets: MakeupSetRaw[]
  outfitSets: OutfitSetRaw[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <MakeupSetTable
        labels={labels}
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
