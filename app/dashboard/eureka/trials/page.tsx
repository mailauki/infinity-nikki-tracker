import { getTrials } from '@/hooks/data/trials'
import { Suspense } from 'react'
import { TrialTable } from '../../trial-table'
import TableContainer from '../../table-container'

export default function TrialsDashboard() {
  return (
    <Suspense>
      <DataTable />
    </Suspense>
  )
}

async function DataTable() {
  const trials = await getTrials()

  return (
    <TableContainer>
      <TrialTable rows={trials} />
    </TableContainer>
  )
}
