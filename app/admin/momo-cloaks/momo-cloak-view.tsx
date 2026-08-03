'use client'

import { useAdminView } from '../admin-view-context'
import { Label, Style } from '@/lib/types/eureka'
import { MomoCloakRaw } from '@/lib/types/momo'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { MomoCloakTable } from './momo-cloak-table'
import MomoCloakList from './momo-cloak-list'
import TableContainer from '../table-container'

export default function MomoCloakView({
  momoCloaks,
  styles,
  labels,
  seasons,
  seasonCategories,
}: {
  momoCloaks: MomoCloakRaw[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <MomoCloakTable
        labels={labels}
        rows={momoCloaks}
        seasonCategories={seasonCategories}
        seasons={seasons}
        styles={styles}
      />
    </TableContainer>
  ) : (
    <MomoCloakList rows={momoCloaks} />
  )
}
