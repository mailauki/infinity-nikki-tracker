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
      getKey={(trial) => trial.id}
      page={page}
      renderRow={(trial) => (
        <ListRow
          back={backUrl || undefined}
          image_url={trial.image_url ?? undefined}
          list="trial"
          slug={trial.slug ?? undefined}
          title={trial.title}
          updated_at={trial.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      slug="trial"
      title="Trial"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
