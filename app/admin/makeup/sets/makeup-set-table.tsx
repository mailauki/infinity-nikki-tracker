'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toTitle } from '@/lib/utils'
import { MakeupSetRaw } from '@/lib/types/makeup'
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import RarityStars from '@/components/rarity-stars'
import { updateMakeupSetRow } from './actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/app/admin/eureka/table-utils'

type Row = MakeupSetRaw

interface MakeupSetTableProps {
  rows: Row[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  outfitSets: OutfitSetRaw[]
}

const LOCKED_FIELDS = ['slug', 'updated_at']

export function MakeupSetTable({
  rows: initialRows,
  styles,
  labels,
  seasons,
  seasonCategories,
  outfitSets,
}: MakeupSetTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  } = useRowActions()

  const editHref = (row: Row) => `/admin/makeup/sets/edit/${row.slug}`

  // The "this is a base set" / self-reference options are excluded from the
  // base_set select: a base row (order 1) has no base_set, and a set can
  // never point at itself (enforced server-side in the full-form actions).
  const baseSetOptions = (row: Row) =>
    rows
      .filter((r) => r.slug !== row.slug)
      .map((r) => ({ value: r.slug, label: r.title ?? r.slug }))

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateMakeupSetRow(newRow.id, {
        title: newRow.title ?? undefined,
        description: newRow.description,
        rarity: newRow.rarity ?? undefined,
        style: newRow.style,
        label: newRow.label,
        seasons: newRow.seasons,
        season_category: newRow.season_category,
        outfit_set: newRow.outfit_set,
        base_set: newRow.base_set,
        order: newRow.order ?? undefined,
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
      field: 'title',
      headerName: 'Title',
      width: 200,
      editable: true,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 200,
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
      field: 'seasons',
      headerName: 'Season',
      width: 160,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...seasons.map((s) => ({ value: s.slug, label: toTitle(s.title ?? '') })),
      ],
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'season_category',
      headerName: 'Season Category',
      width: 180,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...seasonCategories.map((sc) => ({ value: sc.slug, label: toTitle(sc.title ?? '') })),
      ],
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'outfit_set',
      headerName: 'Associated Outfit',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...outfitSets.map((s) => ({ value: s.slug ?? '', label: s.title ?? '' })),
      ],
      valueFormatter: (value: string | null) => (value ? toTitle(value) : '—'),
      renderCell: ({ row }: GridRenderCellParams<Row>) => {
        const outfit = outfitSets.find((s) => s.slug === row.outfit_set)
        return <span>{outfit?.title ?? (row.outfit_set ? toTitle(row.outfit_set) : '—')}</span>
      },
    },
    {
      field: 'order',
      headerName: 'Order',
      width: 90,
      editable: true,
      type: 'number',
    },
    {
      field: 'base_set',
      headerName: 'Base Set',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: (params) => [
        { value: '', label: 'This is a base set' },
        ...baseSetOptions(params?.row ?? rows[0]),
      ],
      valueFormatter: (value: string | null) => (value ? toTitle(value) : '—'),
      renderCell: ({ row }: GridRenderCellParams<Row>) => {
        const base = rows.find((r) => r.slug === row.base_set)
        return <span>{base?.title ?? (row.base_set ? toTitle(row.base_set) : '—')}</span>
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 280,
      sortable: false,
      editable: true,
      valueFormatter: (value: string | null) => value || '—',
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
      sx={{ border: 0, bgcolor: 'transparent' }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
