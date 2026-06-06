'use client'

import { useCallback, useState } from 'react'
import { Box, Chip, Stack } from '@mui/material'
import { Category } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toSlug, toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { EurekaSet, Label, Style } from '@/lib/types/eureka'
import LazyAvatar from '@/components/lazy-avatar'
import RarityStars from '@/components/rarity-stars'
import { updateEurekaSet } from '@/app/(admin)/dashboard/actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/components/admin/table-utils'

type Row = EurekaSet

interface EurekaSetTableProps {
  rows: Row[]
  styles: Style[]
  labels: Label[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'colors', 'eureka_set_trials', 'updated_at']

export function EurekaSetTable({ rows: initialRows, styles, labels }: EurekaSetTableProps) {
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
    `${navLinksData.dashboard.eureka.sets.edit}/${row.slug ?? toSlug(row.title)}`

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateEurekaSet(newRow.id, {
        title: newRow.title,
        description: newRow.description,
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
      width: 64,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 52, justifyContent: 'center' }}>
          {isEditing(row.id) ? (
            <LockedCell href={editHref(row)}>
              <LazyAvatar
                alt={row.title || 'Image'}
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
              alt={row.title || 'Image'}
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
          <Stack sx={{ flex: 1, height: 52, justifyContent: 'center', color: 'text.secondary' }}>
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
      valueOptions: styles.map((s) => ({ value: s.slug, label: toTitle(s.title ?? '') })),
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'label',
      headerName: 'Label',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: labels.map((l) => ({ value: l.slug, label: toTitle(l.title ?? '') })),
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'colors',
      headerName: 'Colors',
      width: 340,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 52, justifyContent: 'center' }}>
          {isEditing(row.id) ? (
            <LockedCell href={editHref(row)}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
                {row.colors
                  ? row.colors.map((color) => (
                      <Chip key={color.slug} label={color.title} size="small" />
                    ))
                  : '—'}
              </Box>
            </LockedCell>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
              {row.colors
                ? row.colors.map((color) => (
                    <Chip key={color.slug} label={color.title} size="small" />
                  ))
                : '—'}
            </Box>
          )}
        </Stack>
      ),
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
      field: 'eureka_set_trials',
      headerName: 'Trial',
      width: 160,
      sortable: false,
      valueGetter: (_value: unknown, row: Row) => {
        if (!row.eureka_set_trials?.length) return '—'
        if (row.eureka_set_trials.length > 1) return `${row.eureka_set_trials.length} trials`
        return toTitle(row.eureka_set_trials[0].trial)
      },
      renderCell: ({ row, value }: GridRenderCellParams<Row>) =>
        isEditing(row.id) ? (
          <LockedCell href={editHref(row)}>
            <span>{value}</span>
          </LockedCell>
        ) : (
          <span>{value}</span>
        ),
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
