'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { useSearchParams } from 'next/navigation'

interface EurekaSetListProps {
  rows: EurekaSet[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  back?: string
}

export default function EurekaSetList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  back,
}: EurekaSetListProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')

  return (
    <AdminList
      getKey={(set) => set.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          back={backUrl || undefined}
          image_url={row.image_url}
          list="eureka-set"
          slug={row.slug ?? undefined}
          subheader={(() => {
            if (!row.eureka_set_trials?.length) return undefined
            if (row.eureka_set_trials.length > 1) return `${row.eureka_set_trials.length} trials`
            return row.eureka_set_trials[0].trial
          })()}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      slug="eureka-set"
      title="Eureka Set"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
