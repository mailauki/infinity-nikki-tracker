'use client'

import { Chip, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { Category } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useSearchParams } from 'next/navigation'
import { formatDate, toSlugVariant, toTitle } from '@/lib/utils'
import { EurekaVariantRaw } from '@/lib/types/eureka'
import LazyAvatar from '@/components/eureka/lazy-avatar'

type Row = EurekaVariantRaw

interface EurekaVariantTableProps {
  rows: Row[]
  back?: string
}

export function EurekaVariantTable({ rows, back }: EurekaVariantTableProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')
  const backParam = backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''

  const columns: GridColDef<Row>[] = [
    {
      field: 'edit',
      headerName: '',
      width: 48,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Tooltip
          title={`Edit ${[toTitle(row.eureka_set!), toTitle(row.category!), toTitle(row.color!)].filter(Boolean).join(' • ')}`}
        >
          <IconButton
            color="secondary"
            href={`/eureka-variant/edit/${row.slug ?? toSlugVariant(row.eureka_set ?? '', row.category ?? '', row.color ?? '')}${backParam}`}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 64,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <LazyAvatar
          alt={row.eureka_set || 'Image'}
          color="transparent"
          size="xs"
          src={row.image_url!}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </LazyAvatar>
      ),
    },
    {
      field: 'eureka_sets',
      headerName: 'Eureka Set',
      width: 200,
      valueGetter: (_value: unknown, row: Row) => row.eureka_sets?.title ?? '—',
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 240,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
      ),
    },
    {
      field: 'categories',
      headerName: 'Category',
      width: 120,
      valueGetter: (_value: unknown, row: Row) => row.categories?.title ?? '—',
    },
    {
      field: 'colors',
      headerName: 'Color',
      width: 120,
      valueGetter: (_value: unknown, row: Row) => row.colors?.title ?? '—',
    },
    {
      field: 'default',
      headerName: 'Default',
      width: 100,
      renderCell: ({ value }: GridRenderCellParams<Row>) =>
        value ? (
          <Chip color="secondary" label="default" size="small" variant="outlined" />
        ) : null,
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      width: 120,
      valueFormatter: (value: string | null) => (value ? formatDate(value) : '—'),
    },
  ]

  return (
    <DataGrid
      disableRowSelectionOnClick
      columns={columns}
      density="compact"
      getRowId={(row) => row.id}
      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      rows={rows}
      sx={{ border: 0 }}
    />
  )
}
