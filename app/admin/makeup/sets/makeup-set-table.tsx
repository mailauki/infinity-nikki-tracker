'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toTitle } from '@/lib/utils'
import { MakeupSetRaw } from '@/lib/types/makeup'
import { OutfitSetRaw, Season, SeasonCategory } from '@/lib/types/outfit'
import { Style } from '@/lib/types/eureka'
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
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  outfitSets: OutfitSetRaw[]
}

// `order` is derived from base_set server-side, so it is display-only here.
const LOCKED_FIELDS = ['slug', 'order', 'updated_at']

export function MakeupSetTable({
  rows: initialRows,
  styles,
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
      const { row: updated, cascadedEvolutions } = await updateMakeupSetRow(newRow.id, {
        title: newRow.title ?? undefined,
        description: newRow.description,
        rarity: newRow.rarity ?? undefined,
        style: newRow.style,
        seasons: newRow.seasons,
        season_category: newRow.season_category,
        outfit_set: newRow.outfit_set,
        base_set: newRow.base_set,
      })
      // Both are derived from base_set server-side, so read them back off the
      // written row: setting or clearing Base Set moves `order` between 1 and 4
      // and replaces an evolution's pairing with its base set's.
      const merged = { ...newRow, order: updated.order, outfit_set: updated.outfit_set }
      // Editing a base row's pairing re-derives its evolutions', which are their
      // own rows here — patch them in or they show a stale outfit until reload.
      const cascadedById = new Map(cascadedEvolutions.map((e) => [e.id, e.outfit_set] as const))
      setRows((prev) =>
        prev.map((r) => {
          if (r.id === newRow.id) return merged
          return cascadedById.has(r.id) ? { ...r, outfit_set: cascadedById.get(r.id) ?? null } : r
        })
      )
      return merged
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
      description:
        "Authored on a base set. An evolution derives it — the outfit line's max evolution.",
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
      description: 'Automatic: 1 for a base set, 4 for an evolution.',
      width: 90,
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
      isCellEditable={({ field, row }) =>
        !LOCKED_FIELDS.includes(field) && !(field === 'outfit_set' && Boolean(row.base_set))
      }
      processRowUpdate={processRowUpdate}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
