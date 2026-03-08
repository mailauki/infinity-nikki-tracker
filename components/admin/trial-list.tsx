'use client'

import { Trial } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { useSearchParams } from 'next/navigation'

interface TrialListProps {
  rows: Trial[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  back?: string
}

export default function TrialList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  back,
}: TrialListProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')

  return (
    <AdminList
      title="Trial"
      slug="trial"
      rows={rows}
      getKey={(trial) => trial.id}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      renderRow={(trial) => (
        <ListRow
          list="trial"
          title={trial.title}
          slug={trial.slug ?? undefined}
          image_url={trial.image_url ?? undefined}
          updated_at={trial.updated_at}
          back={backUrl || undefined}
        />
      )}
    />
  )
}
