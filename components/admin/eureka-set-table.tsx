'use client'

import { Box, Chip, IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { Category } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useSearchParams } from 'next/navigation'
import { formatDate, toSlug, toTitle } from '@/lib/utils'
import { EurekaSet } from '@/lib/types/eureka'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import RarityStars from '../rarity-stars'

type Row = EurekaSet

interface EurekaSetTableProps {
  rows: Row[]
  back?: string
}

export function EurekaSetTable({ rows, back }: EurekaSetTableProps) {
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
            href={`/eureka-set/edit/${row.slug ?? toSlug(row.title)}${backParam}`}
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
          color="transparent"
          size="sm"
          src={row.image_url!}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </LazyAvatar>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 200,
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
      field: 'rarity',
      headerName: 'Rarity',
      width: 120,
      renderCell: ({ value }: GridRenderCellParams<Row>) =>
        value ? <Stack justifyContent='center' sx={{ flex: 1, height: 35 }}><RarityStars rarity={value} /></Stack> : '—',
    },
    {
      field: 'style',
      headerName: 'Style',
      width: 120,
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'label',
      headerName: 'Label',
      width: 120,
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'colors',
      headerName: 'Colors',
      width: 340,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
          {row.colors
            ? row.colors.map((color) => <Chip key={color.slug} label={color.title} size="small" />)
            : '—'}
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 280,
      sortable: false,
    },
    {
      field: 'eureka_set_trials',
      headerName: 'Trial',
      width: 160,
      sortable: false,
      valueGetter: (_value: unknown, row: Row) => {
        if (!row.eureka_set_trials?.length) return '—'
        if (row.eureka_set_trials.length > 1) return `${row.eureka_set_trials.length} trials`
        return toTitle(row.eureka_set_trials[0].trial)
      },
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
