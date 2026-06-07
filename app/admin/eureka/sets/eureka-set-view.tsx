'use client'

import { useAdminView } from '../../admin-view-context'
import { EurekaSet, Label, Style } from '@/lib/types/eureka'
import { EurekaSetTable } from './eureka-set-table'
import EurekaSetList from './eureka-set-list'
import TableContainer from '../../table-container'

export default function EurekaSetView({
  eurekaSets,
  styles,
  labels,
}: {
  eurekaSets: EurekaSet[]
  styles: Style[]
  labels: Label[]
}) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <EurekaSetTable labels={labels} rows={eurekaSets} styles={styles} />
    </TableContainer>
  ) : (
    <EurekaSetList rows={eurekaSets} />
  )
}
