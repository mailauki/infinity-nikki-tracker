'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toTitle } from '@/lib/utils'
import { MomoCloakRaw } from '@/lib/types/momo'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import RarityStars from '@/components/rarity-stars'
import { updateMomoCloakRow } from './actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/app/admin/eureka/table-utils'

type Row = MomoCloakRaw

interface MomoCloakTableProps {
  rows: Row[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
}

const LOCKED_FIELDS = ['slug', 'updated_at']

export function MomoCloakTable({
  rows: initialRows,
  styles,
  labels,
  seasons,
  seasonCategories,
}: MomoCloakTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  } = useRowActions()

  const editHref = (row: Row) => `/admin/momo-cloaks/edit/${row.slug}`

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateMomoCloakRow(newRow.id, {
        title: newRow.title ?? undefined,
        description: newRow.description,
        rarity: newRow.rarity,
        style: newRow.style,
        label: newRow.label,
        seasons: newRow.seasons,
        season_category: newRow.season_category,
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
