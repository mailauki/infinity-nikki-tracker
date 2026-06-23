'use client'

import { useState } from 'react'
import { Stack } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { navLinksData } from '@/lib/nav-links'
import { Evolution, OutfitCategory } from '@/lib/types/outfit'
import ImageUpload from '@/components/forms/image-upload'
import { categoryImageColumns } from '@/components/admin/variant-image-cell'
import { useAdminView } from '@/app/admin/admin-view-context'
import { TABLE_ROW_HEIGHT } from '@/lib/types/props'

type Row = Evolution

interface OutfitEvolutionTableProps {
  rows: Row[]
  outfitCategories: OutfitCategory[]
}

export function OutfitEvolutionTable({
  rows: initialRows,
  outfitCategories,
}: OutfitEvolutionTableProps) {
  const { showVariantColumns } = useAdminView()
  const [rows, setRows] = useState<Row[]>(initialRows)
  const editHref = (row: Row) =>
    `${navLinksData.admin.outfits.evolutions.edit}/${row.slug}?back=${encodeURIComponent(navLinksData.admin.outfits.evolutions.list)}`

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
          key="open"
          icon={<OpenInNewIcon color="secondary" />}
          label="Edit on set form"
          title="Edit on set form"
          onClick={() => window.location.assign(editHref(row))}
        />,
      ],
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: TABLE_ROW_HEIGHT,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ py: 0.5, justifyContent: 'center' }}>
          <ImageUpload
            column="image_url"
            size="sm"
            slug={row.slug}
            table="evolutions"
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
      field: 'alt_image_url',
      headerName: 'Alt Image',
      width: TABLE_ROW_HEIGHT,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ py: 0.5, justifyContent: 'center' }}>
          <ImageUpload
            column="alt_image_url"
            size="sm"
            slug={row.slug}
            table="evolutions"
            url={row.alt_image_url ?? null}
            onUpload={(url) =>
              setRows((prev) =>
                prev.map((r) => (r.slug === row.slug ? { ...r, alt_image_url: url } : r))
              )
            }
          />
        </Stack>
      ),
    },
    // One column per category, toggled by the toolbar. Each shows this
    // evolution's variant for the category (or a locked cell when absent).
    ...(showVariantColumns
      ? categoryImageColumns<Row>({
          outfitCategories,
          getVariant: (row, categorySlug) =>
            (row.outfit_variants ?? []).find((v) => v.outfit_category === categorySlug) ?? null,
          onUpload: (row, variantId, column, url) =>
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? {
                      ...r,
                      outfit_variants: (r.outfit_variants ?? []).map((v) =>
                        v.id === variantId ? { ...v, [column]: url } : v
                      ),
                    }
                  : r
              )
            ),
        })
      : []),
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
      getRowId={(row) => row.id}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
      }}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      rowHeight={TABLE_ROW_HEIGHT}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
    />
  )
}
