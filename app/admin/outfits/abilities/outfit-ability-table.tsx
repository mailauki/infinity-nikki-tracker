'use client'

import { useState } from 'react'
import { Stack } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { navLinksData } from '@/lib/nav-links'
import { AbilityRaw } from '@/hooks/data/admin/abilities'
import ImageUpload from '@/components/forms/image-upload'

type Row = AbilityRaw

interface OutfitAbilityTableProps {
  rows: Row[]
}

export function OutfitAbilityTable({ rows: initialRows }: OutfitAbilityTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const editHref = (row: Row) =>
    `${navLinksData.admin.outfits.abilities.edit}/${row.slug}?back=${encodeURIComponent(navLinksData.admin.outfits.abilities.list)}`

  const columns: GridColDef<Row>[] = [
    {
      field: 'id',
      headerName: 'ID',
      type: 'number',
      width: 80,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 64,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon color="secondary" />}
          label="Edit"
          title="Edit"
          onClick={() => window.location.assign(editHref(row))}
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
            table="abilities"
            url={row.image_url ?? null}
            onUpload={(url) =>
              setRows((prev) =>
                prev.map((r) => (r.slug === row.slug ? { ...r, image_url: url } : r))
              )
            }
          />
        </Stack>
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
      getRowId={(row) => row.id}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
        sorting: { sortModel: [{ field: 'title', sort: 'asc' }] },
      }}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      rowHeight={100}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
    />
  )
}
