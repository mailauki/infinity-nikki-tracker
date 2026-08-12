'use client'

import { Box, Chip } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { updateFeedbackRow } from './actions'
import { FEEDBACK_STATUSES, type Feedback, type FeedbackStatus } from '@/lib/types/feedback'

const STATUS_COLOR: Record<FeedbackStatus, 'default' | 'info' | 'success' | 'warning'> = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  declined: 'default',
}

export default function FeedbackView({ rows }: { rows: Feedback[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('new')

  const visible = statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)

  const columns: GridColDef<Feedback>[] = [
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
      renderCell: (params) => (
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
        disableRowSelectionOnClick
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        processRowUpdate={(updated: Feedback) => {
          startTransition(async () => {
            const result = await updateFeedbackRow(updated.id, {
              status: updated.status as FeedbackStatus,
              admin_notes: updated.admin_notes,
            })
            if (result.error) {
              enqueueSnackbar('Could not save that change.', { variant: 'error' })
            }
          })
          return updated
        }}
        rows={visible}
        onProcessRowUpdateError={(error) => {
          console.error('Row update failed:', error)
          enqueueSnackbar('Could not save that change.', { variant: 'error' })
        }}
        onRowDoubleClick={(params) => router.push(`/admin/feedback/${params.id}`)}
      />
    </Box>
  )
}
