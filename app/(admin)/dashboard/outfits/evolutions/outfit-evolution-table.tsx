'use client'

import { Stack } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { navLinksData } from '@/lib/nav-links'
import { Evolution } from '@/lib/types/outfit'
import LazyAvatar from '@/components/lazy-avatar'
import { ImageNotSupported } from '@mui/icons-material'

type Row = Evolution

interface OutfitEvolutionTableProps {
  rows: Row[]
}

export function OutfitEvolutionTable({ rows }: OutfitEvolutionTableProps) {
  const editHref = (row: Row) => `${navLinksData.dashboard.outfits.evolutions.edit}/${row.slug}`

  const columns: GridColDef<Row>[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 64,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="open"
          icon={<OpenInNewIcon color="secondary" />}
          label="Edit on set form"
          title="Edit on set form"
          onClick={() => (window.location.href = editHref(row))}
        />,
      ],
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 64,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 52, justifyContent: 'center' }}>
          <LazyAvatar
            alt={row.subtitle ?? row.title}
            color="transparent"
            size="sm"
            src={row.image_url ?? ''}
            sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
          >
            <ImageNotSupported fontSize="inherit" />
          </LazyAvatar>
        </Stack>
      ),
    },
    {
      field: 'title',
      headerName: 'Set Title',
      width: 200,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      field: 'subtitle',
      headerName: 'Subtitle',
      width: 220,
      valueFormatter: (value: string | null) => value ?? '—',
    },
    {
      field: 'order',
      headerName: 'Order',
      width: 80,
      type: 'number',
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      sortable: false,
      valueFormatter: (value: string | null) => value ?? '—',
    },
    {
      field: 'outfit_set',
      headerName: 'Outfit Set',
      width: 180,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
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
  ]

  return (
    <DataGrid
      disableRowSelectionOnClick
      columns={columns}
      getRowId={(row) => row.slug}
      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
    />
  )
}
