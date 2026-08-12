'use client'

import { useCallback, useState } from 'react'
import { Box, Chip } from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { enqueueSnackbar } from 'notistack'
import { updateFeedbackRow } from './actions'
import { actionsColumn, DATA_GRID_DEFAULTS, useRowActions } from '@/app/admin/eureka/table-utils'
import { FEEDBACK_STATUSES, type Feedback, type FeedbackStatus } from '@/lib/types/feedback'

const STATUS_COLOR: Record<FeedbackStatus, 'default' | 'info' | 'success' | 'warning'> = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  declined: 'default',
}

const LOCKED_FIELDS = ['created_at', 'type', 'category', 'title', 'entity_slug', 'page_path']

export default function FeedbackView({ rows: initialRows }: { rows: Feedback[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<Feedback[]>(initialRows)
  const {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  } = useRowActions()
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('new')

  const visible = statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)

  const processRowUpdate = useCallback(async (newRow: Feedback, oldRow: Feedback) => {
    const result = await updateFeedbackRow(newRow.id, {
      status: newRow.status as FeedbackStatus,
      admin_notes: newRow.admin_notes,
    })
    if (result.error) {
      enqueueSnackbar('Could not save that change.', { variant: 'error' })
      return oldRow
    }
    setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)))
    return newRow
  }, [])

  const columns: GridColDef<Feedback>[] = [
    actionsColumn<Feedback>({
      isEditing,
      handleEditClick,
      handleSaveClick,
      handleCancelClick,
      onViewClick: (row) => router.push(`/admin/feedback/${row.id}`),
      viewLabel: 'View detail',
    }),
    {
      field: 'created_at',
      headerName: 'Received',
      width: 160,
      valueFormatter: (value: string) => new Date(value).toLocaleString(),
    },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
    { field: 'entity_slug', headerName: 'About', width: 160 },
    { field: 'page_path', headerName: 'Page', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: [...FEEDBACK_STATUSES],
      renderCell: (params: GridRenderCellParams<Feedback>) => (
        <Chip
          color={STATUS_COLOR[params.value as FeedbackStatus]}
          label={params.value}
          size="small"
        />
      ),
    },
    { field: 'admin_notes', headerName: 'Notes', width: 220, editable: true },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {(['new', 'in_progress', 'resolved', 'declined', 'all'] as const).map((option) => (
          <Chip
            key={option}
            color={statusFilter === option ? 'primary' : 'default'}
            label={option}
            onClick={() => setStatusFilter(option)}
          />
        ))}
      </Box>

      <DataGrid
        {...DATA_GRID_DEFAULTS}
        columns={columns}
        getRowId={(row) => row.id}
        isCellEditable={({ field }) => !LOCKED_FIELDS.includes(field)}
        processRowUpdate={processRowUpdate}
        rowModesModel={rowModesModel}
        rows={visible}
        sx={{ border: 0 }}
        onRowModesModelChange={setRowModesModel}
      />
    </Box>
  )
}
