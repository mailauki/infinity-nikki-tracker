'use client'

import { useCallback, useState } from 'react'
import { Box, Chip, IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Category } from '@mui/icons-material'
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
  useGridApiRef,
} from '@mui/x-data-grid'
import { useSearchParams } from 'next/navigation'
import { formatDate, toSlug, toTitle } from '@/lib/utils'
import { EurekaSet, Label, Style } from '@/lib/types/eureka'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import RarityStars from '../rarity-stars'
import { updateEurekaSet } from '@/app/(main)/(admin)/dashboard/actions'

type Row = EurekaSet

interface EurekaSetTableProps {
  rows: Row[]
  back?: string
  styles: Style[]
  labels: Label[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'colors', 'eureka_set_trials', 'updated_at']

function LockedCell({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Tooltip title="Edit on full form">
      <IconButton href={href} size="small" sx={{ borderRadius: 1, px: 0.5, opacity: 0.5 }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}

export function EurekaSetTable({ rows: initialRows, back, styles, labels }: EurekaSetTableProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')
  const backParam = backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''
  const apiRef = useGridApiRef()

  const [rows, setRows] = useState<Row[]>(initialRows)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

  const editHref = (row: Row) => `/eureka-set/edit/${row.slug ?? toSlug(row.title)}${backParam}`

  const isEditing = (id: GridRowId) => rowModesModel[id]?.mode === GridRowModes.Edit

  const handleEditClick = useCallback(
    (id: GridRowId) => () => setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } })),
    []
  )

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } })),
    []
  )

  const handleCancelClick = useCallback(
    (id: GridRowId) => () =>
      setRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      })),
    []
  )

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
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 96,
      getActions: ({ id, row }) =>
        isEditing(id)
          ? [
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon color="primary" />}
                label="Save"
                title="Save"
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                title="Cancel"
                onClick={handleCancelClick(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon color="secondary" />}
                label="Edit row"
                title="Edit row"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                key="open"
                icon={<OpenInNewIcon />}
                label="View page"
                title="View page"
                onClick={() => (window.location.href = `/eureka/${row.slug}`)}
              />,
            ],
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 64,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) =>
        isEditing(row.id) ? (
          <LockedCell href={editHref(row)}>
            <LazyAvatar
              alt={row.title || 'Image'}
              color="transparent"
              size="xs"
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
            size="xs"
            src={row.image_url!}
            sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
          >
            <Category fontSize="inherit" />
          </LazyAvatar>
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
          <Stack justifyContent="center" sx={{ flex: 1, height: 35 }}>
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
      renderCell: ({ row }: GridRenderCellParams<Row>) =>
        isEditing(row.id) ? (
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
      disableRowSelectionOnClick
      apiRef={apiRef}
      columns={columns}
      density="compact"
      editMode="row"
      getRowId={(row) => row.id}
      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
      isCellEditable={({ field }) => !LOCKED_FIELDS.includes(field)}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      processRowUpdate={processRowUpdate}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0 }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
