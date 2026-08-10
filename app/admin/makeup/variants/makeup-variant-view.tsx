'use client'

import { useAdminView } from '../../admin-view-context'
import { Style } from '@/lib/types/eureka'
import { MakeupCategory, MakeupSetRaw, MakeupVariantRaw } from '@/lib/types/makeup'
import { MakeupVariantTable } from './makeup-variant-table'
import MakeupVariantList from './makeup-variant-list'
import TableContainer from '../../table-container'

export default function MakeupVariantView({
  makeupVariants,
  makeupSets,
  makeupCategories,
  styles,
}: {
  makeupVariants: MakeupVariantRaw[]
  makeupSets: MakeupSetRaw[]
  makeupCategories: MakeupCategory[]
  styles: Style[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <MakeupVariantTable
        makeupCategories={makeupCategories}
        makeupSets={makeupSets}
        rows={makeupVariants}
        styles={styles}
      />
    </TableContainer>
  ) : (
    <MakeupVariantList rows={makeupVariants} />
  )
}
