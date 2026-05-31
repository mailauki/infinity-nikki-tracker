'use client'

import { Trial } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { navLinksData } from '@/lib/nav-links'

interface TrialListProps {
  rows: Trial[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function TrialList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: TrialListProps) {
  return (
    <AdminList
      addHref={navLinksData.dashboard.eureka.trials.add}
      getKey={(trial) => trial.id}
      page={page}
      renderRow={(trial) => (
        <ListRow
          image_url={trial.image_url ?? undefined}
          list="eureka/trials"
          slug={trial.slug ?? undefined}
          subheader={trial.location ?? ''}
          title={trial.title}
          updated_at={trial.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Trial"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
