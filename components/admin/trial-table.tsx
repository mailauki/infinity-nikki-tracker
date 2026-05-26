'use client'

import { IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { Category } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useSearchParams } from 'next/navigation'
import { formatDate, toSlug } from '@/lib/utils'
import { Trial } from '@/lib/types/eureka'
import LazyAvatar from '@/components/eureka/lazy-avatar'

type Row = Trial

interface TrialTableProps {
  rows: Row[]
  back?: string
}

export function TrialTable({ rows, back }: TrialTableProps) {
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
        <Tooltip title={`Edit ${row.title}`}>
          <IconButton
            color="secondary"
            href={`/trial/edit/${row.slug ?? toSlug(row.title)}${backParam}`}
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
          alt={row.title || 'Image'}
          size="xs"
          src={row.image_url!}
          sx={{ width: 40, bgcolor: 'transparent', color: 'text.disabled' }}
          variant="rounded"
        >
          <Category fontSize="inherit" />
        </LazyAvatar>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 240,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 200,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
      ),
    },
    {
      field: 'realm',
      headerName: 'Realm',
      width: 140,
      valueFormatter: (value: string | null) => value ?? '—',
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 120,
      valueFormatter: (value: string | null) => value ?? '—',
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 280,
      sortable: false,
      valueFormatter: (value: string | null) => value ?? '—',
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
