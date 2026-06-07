'use client'

import { Trial } from '@/lib/types/eureka'
import ListRow from '../../list-row'
import { navLinksData } from '@/lib/nav-links'
import { AdminList } from '../../admin-list'

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
      addHref={navLinksData.admin.eureka.trials.add}
      getKey={(trial) => trial.id}
      page={page}
      renderRow={(trial) => (
        <ListRow
          image_url={trial.image_url ?? undefined}
          list="admin/eureka/trials"
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
