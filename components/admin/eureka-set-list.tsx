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
      title="Eureka Set"
      slug="eureka-set"
      rows={rows}
      getKey={(set) => set.id}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      renderRow={(row) => (
        <ListRow
          list="eureka-set"
          title={row.title}
          subheader={row.trial ?? undefined}
          slug={row.slug ?? undefined}
          image_url={row.image_url}
          updated_at={row.updated_at}
          back={backUrl || undefined}
        />
      )}
    />
  )
}
