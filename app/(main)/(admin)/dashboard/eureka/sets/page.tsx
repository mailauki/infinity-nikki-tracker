import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getLabels } from '@/hooks/data/labels'
import { getStyles } from '@/hooks/data/styles'
import { Suspense } from 'react'
import { EurekaSetTable } from '../../eureka-set-table'
import TableContainer from '../../table-container'

export default function EurekaSetsDashboard() {
  return (
    <Suspense>
      <DataTable />
    </Suspense>
  )
}

async function DataTable() {
  const [eurekaSets, styles, labels] = await Promise.all([
    getEurekaSets(),
    getStyles(),
    getLabels(),
  ])

  return (
    <TableContainer>
      <EurekaSetTable labels={labels} rows={eurekaSets} styles={styles} />
    </TableContainer>
  )
}
