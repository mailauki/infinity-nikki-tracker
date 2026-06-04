'use client'

import { useCallback } from 'react'
import { IconButton, Stack, Tooltip } from '@mui/material'
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
} from '@mui/x-data-grid'
import { formatDate, toSlug } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { Trial } from '@/lib/types/eureka'
import LazyAvatar from '@/components/lazy-avatar'
import { updateTrial } from '@/app/(admin)/dashboard/actions'
import { useState } from 'react'

type Row = Trial

interface TrialTableProps {
  rows: Row[]
}

function LockedCell({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Tooltip title="Edit on full form">
      <IconButton href={href} size="small" sx={{ borderRadius: 1, px: 0.5, opacity: 0.5 }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}

export function TrialTable({ rows: initialRows }: TrialTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

  const editHref = (row: Row) =>
    `${navLinksData.dashboard.eureka.trials.edit}/${row.slug ?? toSlug(row.title)}`

  const handleEditClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } }))
    },
    []
  )

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } }))
    },
    []
  )

  const handleCancelClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }))
    },
    []
  )

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

  const isEditing = (id: GridRowId) => rowModesModel[id]?.mode === GridRowModes.Edit

  const columns: GridColDef<Row>[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 96,
      getActions: ({ id }) =>
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
                icon={<OpenInNewIcon color="secondary" />}
                label="View trials"
                title="View trials"
                onClick={() => (window.location.href = '/eureka/trials')}
              />,
            ],
    },
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
                size="sm"
                src={row.image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                variant="rounded"
              >
                <Category fontSize="inherit" />
              </LazyAvatar>
            </LockedCell>
          ) : (
            <LazyAvatar
              alt={row.title || 'Image'}
              size="sm"
              src={row.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              variant="rounded"
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
      disableRowSelectionOnClick
      columns={columns}
      editMode="row"
      getRowId={(row) => row.id}
      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
      isCellEditable={({ field }) => !['slug', 'image_url', 'updated_at'].includes(field)}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      processRowUpdate={processRowUpdate}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0 }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
