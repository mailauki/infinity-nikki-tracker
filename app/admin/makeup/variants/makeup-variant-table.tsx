'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { FaceRetouchingNatural } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toTitle } from '@/lib/utils'
import { Label, Style } from '@/lib/types/eureka'
import { MakeupCategory, MakeupSetRaw, MakeupVariantRaw } from '@/lib/types/makeup'
import RarityStars from '@/components/rarity-stars'
import LazyImage from '@/components/lazy-image'
import { updateMakeupVariantRow } from './actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/app/admin/eureka/table-utils'
import { TABLE_ROW_HEIGHT } from '@/lib/types/props'

type Row = MakeupVariantRaw

interface MakeupVariantTableProps {
  rows: Row[]
  makeupSets: MakeupSetRaw[]
  makeupCategories: MakeupCategory[]
  styles: Style[]
  labels: Label[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'updated_at']

export function MakeupVariantTable({
  rows: initialRows,
  makeupSets,
  makeupCategories,
  styles,
  labels,
}: MakeupVariantTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  } = useRowActions()

  const editHref = (row: Row) => `/admin/makeup/variants/edit/${row.slug}`

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateMakeupVariantRow(newRow.id, {
        makeup_set: newRow.makeup_set,
        makeup_category: newRow.makeup_category,
        title: newRow.title,
        rarity: newRow.rarity,
        style: newRow.style,
        label: newRow.label,
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
                <FaceRetouchingNatural fontSize="inherit" />
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
              <FaceRetouchingNatural fontSize="inherit" />
            </LazyImage>
          )}
        </Stack>
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
      field: 'makeup_set',
      headerName: 'Makeup Set',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...makeupSets.map((s) => ({ value: s.slug ?? '', label: s.title ?? '' })),
      ],
      valueGetter: (_value: unknown, row: Row) => row.makeup_set ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{row.makeup_sets?.title ?? '—'}</span>
      ),
    },
    {
      field: 'makeup_category',
      headerName: 'Category',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...makeupCategories.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      ],
      valueGetter: (_value: unknown, row: Row) => row.makeup_category ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span>
          {row.makeup_categories?.title ??
            (row.makeup_category ? toTitle(row.makeup_category) : '—')}
        </span>
      ),
    },
    {
      field: 'rarity',
      headerName: 'Rarity',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [2, 3, 4, 5],
      renderCell: ({ value }: GridRenderCellParams<Row>) =>
        value ? (
          <Stack sx={{ flex: 1, height: 50, justifyContent: 'center', color: 'text.secondary' }}>
            <RarityStars rarity={value} />
          </Stack>
        ) : (
          '—'
        ),
    },
    {
      field: 'style',
      headerName: 'Style',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...styles.map((s) => ({ value: s.slug, label: toTitle(s.title ?? '') })),
      ],
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'label',
      headerName: 'Label',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...labels.map((l) => ({ value: l.slug, label: toTitle(l.title ?? '') })),
      ],
      valueFormatter: (value: string | null) => toTitle(value || '—'),
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
