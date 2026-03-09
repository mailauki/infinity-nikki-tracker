'use client'

import { Avatar, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlugVariant } from '@/lib/utils'
import { AdminTable, Column } from './admin-table'
import { EurekaVariantRaw } from '@/lib/types/eureka'
import { Category } from '@mui/icons-material'
import { useSearchParams } from 'next/navigation'

type Row = EurekaVariantRaw

interface EurekaVariantTableProps {
  rows: Row[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  back?: string
}

export function EurekaVariantTable({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  back,
}: EurekaVariantTableProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')
  const backParam = backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''

  const columns: Column<Row>[] = [
    {
      header: 'Edit',
      cellSx: { py: 0 },
      cell: (v) => (
        <Tooltip title={`Edit ${[v.eureka_set, v.category, v.color].filter(Boolean).join(' • ')}`}>
          <IconButton
            size="small"
            color="secondary"
            href={`/eureka-variant/edit/${v.slug ?? toSlugVariant(v.eureka_set ?? '', v.category ?? '', v.color ?? '')}${backParam}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      header: 'Image',
      cell: (v) => (
        <Avatar size="xs" src={v.image_url!} alt={v.eureka_set || 'Image'}>
          <Category fontSize="inherit" />
        </Avatar>
      ),
    },
    {
      header: 'Eureka Set',
      cell: (v) => (
        <Typography noWrap variant="body2" fontWeight="medium">
          {v.eureka_set}
        </Typography>
      ),
    },
    {
      header: 'Slug',
      cell: (v) => (
        <Typography noWrap variant="caption" fontFamily="monospace">
          {v.slug}
        </Typography>
      ),
    },
    { header: 'Category', cell: (v) => v.category },
    { header: 'Color', cell: (v) => v.color },
    {
      header: 'Default',
      cell: (v) =>
        v.default ? (
          <Chip label="default" size="small" color="secondary" variant="outlined" />
        ) : null,
    },
    {
      header: 'Updated',
      cell: (v) => (
        <Typography variant="caption" noWrap>
          {v.updated_at ? new Date(v.updated_at).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
  ]

  return (
    <AdminTable
      title="Eureka Variant"
      rows={rows}
      columns={columns}
      slug="eureka-variant"
      getKey={(v) => v.id}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
