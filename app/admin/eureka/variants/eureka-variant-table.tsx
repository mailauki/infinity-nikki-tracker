'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { Category, CheckBox } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toSlugVariant, toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { EurekaCategory, EurekaColor, EurekaSet, EurekaVariantRaw } from '@/lib/types/eureka'
import LazyAvatar from '@/components/lazy-avatar'
import { updateEurekaVariant } from '@/app/admin/actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/components/admin/table-utils'
import { TABLE_ROW_HEIGHT } from '@/lib/types/props'

type Row = EurekaVariantRaw

interface EurekaVariantTableProps {
  rows: Row[]
  eurekaSets: EurekaSet[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'updated_at']

export function EurekaVariantTable({
  rows: initialRows,
  eurekaSets,
  categories,
  colors,
}: EurekaVariantTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  } = useRowActions()

  const editHref = (row: Row) =>
    `${navLinksData.admin.eureka.variants.edit}/${row.slug ?? toSlugVariant(row.eureka_set ?? '', row.category ?? '', row.color ?? '')}`

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateEurekaVariant(newRow.id, {
        eureka_set: newRow.eureka_set,
        category: newRow.category,
        color: newRow.color,
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
              <LazyAvatar
                alt={row.eureka_set || 'Image'}
                color="transparent"
                size="sm"
                src={row.image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Category fontSize="inherit" />
              </LazyAvatar>
            </LockedCell>
          ) : (
            <LazyAvatar
              alt={row.eureka_set || 'Image'}
              color="transparent"
              size="sm"
              src={row.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          )}
        </Stack>
      ),
    },
    {
      field: 'eureka_set',
      headerName: 'Eureka Set',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: eurekaSets.map((s) => ({ value: s.slug, label: s.title })),
      valueGetter: (_value: unknown, row: Row) => row.eureka_set ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{row.eureka_sets?.title ?? '—'}</span>
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
      field: 'category',
      headerName: 'Category',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: categories.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      valueGetter: (_value: unknown, row: Row) => row.category ?? '',
      valueFormatter: (value: string | null) =>
        categories.find((c) => c.slug === value)?.title ?? toTitle(value || '—'),
    },
    {
      field: 'color',
      headerName: 'Color',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: colors.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      valueGetter: (_value: unknown, row: Row) => row.color ?? '',
      valueFormatter: (value: string | null) =>
        colors.find((c) => c.slug === value)?.title ?? toTitle(value || '—'),
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
