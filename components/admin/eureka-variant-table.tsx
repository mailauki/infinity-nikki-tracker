'use client'

import { Avatar, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlugVariant, toTitle } from '@/lib/utils'
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
      cell: (variant) => (
        <Tooltip
          title={`Edit ${[toTitle(variant.eureka_set!), toTitle(variant.category!), toTitle(variant.color!)].filter(Boolean).join(' • ')}`}
        >
          <IconButton
            color="secondary"
            href={`/eureka-variant/edit/${variant.slug ?? toSlugVariant(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? '')}${backParam}`}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      header: 'Image',
      cell: (variant) => (
        <Avatar
          alt={variant.eureka_set || 'Image'}
          size="xs"
          src={variant.image_url!}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </Avatar>
      ),
    },
    {
      header: 'Eureka Set',
      cell: (variant) => (
        <Typography noWrap fontWeight="medium" variant="body2">
          {toTitle(variant.eureka_set!)}
        </Typography>
      ),
    },
    {
      header: 'Slug',
      cell: (variant) => (
        <Typography noWrap fontFamily="monospace" variant="caption">
          {variant.slug}
        </Typography>
      ),
    },
    { header: 'Category', cell: (variant) => toTitle(variant.category!) },
    { header: 'Color', cell: (variant) => toTitle(variant.color!) },
    {
      header: 'Default',
      cell: (variant) =>
        variant.default ? (
          <Chip color="secondary" label="default" size="small" variant="outlined" />
        ) : null,
    },
    {
      header: 'Updated',
      cell: (variant) => (
        <Typography noWrap variant="caption">
          {variant.updated_at ? new Date(variant.updated_at).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
  ]

  return (
    <AdminTable
      columns={columns}
      getKey={(variant) => variant.id}
      page={page}
      rows={rows}
      rowsPerPage={rowsPerPage}
      slug="eureka-variant"
      title="Eureka Variant"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
