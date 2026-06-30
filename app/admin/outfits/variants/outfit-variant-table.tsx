'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { CheckBox, Checkroom } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { OutfitCategory, OutfitSetRaw, OutfitVariantRaw } from '@/lib/types/outfit'
import LazyImage from '@/components/lazy-image'
import { updateOutfitVariant } from '@/app/admin/actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/app/admin/eureka/table-utils'
import { TABLE_ROW_HEIGHT } from '@/lib/types/props'

type Row = OutfitVariantRaw

interface OutfitVariantTableProps {
  rows: Row[]
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'updated_at']

export function OutfitVariantTable({
  rows: initialRows,
  outfitSets,
  outfitCategories,
}: OutfitVariantTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  } = useRowActions()

  const editHref = (row: Row) => `${navLinksData.admin.outfits.variants.edit}/${row.slug}`

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateOutfitVariant(newRow.id, {
        outfit_set: newRow.outfit_set,
        outfit_category: newRow.outfit_category,
        title: newRow.title,
        default: newRow.default,
      })
      setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)))
      return newRow
    } catch {
      return oldRow
    }
  }, [])

  const columns: GridColDef<Row>[] = [
    actionsColumn<Row>({
      isEditing,
      handleEditClick,
      handleSaveClick,
      handleCancelClick,
      onViewClick: (row) => window.location.assign(editHref(row)),
    }),
    {
      field: 'image_url',
      headerName: 'Image',
      width: TABLE_ROW_HEIGHT,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: TABLE_ROW_HEIGHT, justifyContent: 'center' }}>
          {isEditing(row.id) ? (
            <LockedCell href={editHref(row)}>
              <LazyImage
                alt={row.slug}
                color="transparent"
                size="sm"
                src={row.image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Checkroom fontSize="inherit" />
              </LazyImage>
            </LockedCell>
          ) : (
            <LazyImage
              alt={row.slug}
              color="transparent"
              size="sm"
              src={row.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Checkroom fontSize="inherit" />
            </LazyImage>
          )}
        </Stack>
      ),
    },
    {
      field: 'outfit_set',
      headerName: 'Outfit Set',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...outfitSets.map((s) => ({ value: s.slug ?? '', label: s.title ?? '' })),
      ],
      valueGetter: (_value: unknown, row: Row) => row.outfit_set ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{row.outfit_sets?.title ?? '—'}</span>
      ),
    },
    {
      field: 'outfit_category',
      headerName: 'Category',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...outfitCategories.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      ],
      valueGetter: (_value: unknown, row: Row) => row.outfit_category ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span>
          {row.outfit_categories?.title ??
            (row.outfit_category ? toTitle(row.outfit_category) : '—')}
        </span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 240,
      renderCell: ({ row, value }: GridRenderCellParams<Row>) =>
        isEditing(row.id) ? (
          <LockedCell href={editHref(row)}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
          </LockedCell>
        ) : (
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
        ),
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 180,
      editable: true,
      valueGetter: (_value: unknown, row: Row) => row.title ?? '',
    },
    {
      field: 'default',
      headerName: 'Default',
      width: 100,
      editable: true,
      type: 'boolean',
      renderCell: ({ value }: GridRenderCellParams<Row>) =>
        value ? <CheckBox color="secondary" fontSize="small" /> : null,
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
      {...DATA_GRID_DEFAULTS}
      columns={columns}
      getRowId={(row) => row.id}
      isCellEditable={({ field }) => !LOCKED_FIELDS.includes(field)}
      processRowUpdate={processRowUpdate}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0 }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
