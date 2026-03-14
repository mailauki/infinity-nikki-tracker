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
      getKey={(variant) => variant.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          back={backUrl || undefined}
          image_url={row.image_url ?? undefined}
          list="eureka-variant"
          slug={row.slug ?? undefined}
          subheader={
            [row.categories?.title, row.colors?.title].filter(Boolean).join(' • ') || undefined
          }
          title={row.eureka_sets?.title ?? '—'}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      slug="eureka-variant"
      title="Eureka Variant"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
