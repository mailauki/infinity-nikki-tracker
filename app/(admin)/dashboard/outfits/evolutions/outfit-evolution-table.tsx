'use client'

import { useState } from 'react'
import { Stack } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { navLinksData } from '@/lib/nav-links'
import { Evolution } from '@/lib/types/outfit'
import ImageUpload from '@/components/forms/image-upload'

type Row = Evolution

interface OutfitEvolutionTableProps {
  rows: Row[]
}

export function OutfitEvolutionTable({ rows: initialRows }: OutfitEvolutionTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
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
      width: 100,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
          <ImageUpload
            column="image_url"
            slug={row.slug}
            table="evolutions"
            url={row.image_url ?? null}
            onUpload={(url) => setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, image_url: url } : r)))}
          />
        </Stack>
      ),
    },
    {
      field: 'alt_image_url',
      headerName: 'Alt Image',
      width: 100,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
          <ImageUpload
            column="alt_image_url"
            slug={row.slug}
            table="evolutions"
            url={row.alt_image_url ?? null}
            onUpload={(url) => setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, alt_image_url: url } : r)))}
          />
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
      rowHeight={100}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
    />
  )
}
