'use client'

import { EurekaVariantRaw } from '@/lib/types/eureka'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { useSearchParams } from 'next/navigation'

interface EurekaVariantListProps {
  rows: EurekaVariantRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  back?: string
}

export default function EurekaVariantList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  back,
}: EurekaVariantListProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')

  return (
    <AdminList
      title="Eureka Variant"
      slug="eureka-variant"
      rows={rows}
      getKey={(v) => v.id}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      renderRow={(row) => (
        <ListRow
          list="eureka-variant"
          title={row.eureka_set ?? '—'}
          subheader={[row.category, row.color].filter(Boolean).join(' • ') || undefined}
          slug={row.slug ?? undefined}
          image_url={row.image_url ?? undefined}
          updated_at={row.updated_at}
          back={backUrl || undefined}
        />
      )}
    />
  )
}
