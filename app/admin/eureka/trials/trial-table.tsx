'use client'

import { useCallback, useState } from 'react'
import { Stack } from '@mui/material'
import { Category } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { formatDate, toSlug } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { Trial } from '@/lib/types/eureka'
import LazyImage from '@/components/lazy-image'
import { updateTrial } from '@/app/admin/actions'
import {
  actionsColumn,
  DATA_GRID_DEFAULTS,
  LockedCell,
  useRowActions,
} from '@/components/admin/table-utils'
import { TABLE_ROW_HEIGHT } from '@/lib/types/props'

type Row = Trial

interface TrialTableProps {
  rows: Row[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'updated_at']

export function TrialTable({ rows: initialRows }: TrialTableProps) {
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
    `${navLinksData.admin.eureka.trials.edit}/${row.slug ?? toSlug(row.title)}`

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateTrial(newRow.id, {
        title: newRow.title,
        realm: newRow.realm,
        location: newRow.location,
        description: newRow.description,
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
      onViewClick: () => window.location.assign('/eureka/trials'),
      viewLabel: 'View trials',
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
                alt={row.title || 'Image'}
                size="sm"
                src={row.image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                variant="rounded"
              >
                <Category fontSize="inherit" />
              </LazyImage>
            </LockedCell>
          ) : (
            <LazyImage
              alt={row.title || 'Image'}
              size="sm"
              src={row.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              variant="rounded"
            >
              <Category fontSize="inherit" />
            </LazyImage>
          )}
        </Stack>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 240,
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
      field: 'realm',
      headerName: 'Realm',
      width: 140,
      editable: true,
      valueFormatter: (value: string | null) => value ?? '—',
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['Wishfield', 'Itzaland'],
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 280,
      sortable: false,
      editable: true,
      valueFormatter: (value: string | null) => value ?? '—',
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
