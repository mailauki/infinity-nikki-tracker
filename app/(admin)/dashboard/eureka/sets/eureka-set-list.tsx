'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { AdminList } from '../../admin-list'
import ListRow from '../../list-row'
import { toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

interface EurekaSetListProps {
  rows: EurekaSet[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function EurekaSetList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: EurekaSetListProps) {
  return (
    <AdminList
      addHref={navLinksData.dashboard.eureka.sets.add}
      getKey={(set) => set.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url}
          list="dashboard/eureka/sets"
          slug={row.slug ?? undefined}
          subheader={(() => {
            if (!row.eureka_set_trials?.length) return '—'
            if (row.eureka_set_trials.length > 1) return row.eureka_set_trials.length + ' trials'
            return toTitle(row.eureka_set_trials[0].trial)
          })()}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Eureka Set"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
