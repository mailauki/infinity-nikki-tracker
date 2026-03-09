'use client'

import { Avatar, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlug } from '@/lib/utils'
import { Trial } from '@/lib/types/eureka'
import { AdminTable, Column } from './admin-table'
import { Category } from '@mui/icons-material'
import { useSearchParams } from 'next/navigation'

type Row = Trial

interface TrialTableProps {
  rows: Row[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  back?: string
}

export function TrialTable({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  back,
}: TrialTableProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')
  const backParam = backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''

  const columns: Column<Row>[] = [
    {
      header: 'Edit',
      cellSx: { py: 0 },
      cell: (trial) => (
        <Tooltip title={`Edit ${trial.title}`}>
          <IconButton
            size="small"
            color="secondary"
            href={`/trial/edit/${trial.slug ?? toSlug(trial.title)}${backParam}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      header: 'Image',
      cell: (v) => (
        <Avatar
          size="xs"
          src={v.image_url!}
          alt={v.title || 'Image'}
          variant="rounded"
          sx={{ width: 40 }}
        >
          <Category fontSize="inherit" />
        </Avatar>
      ),
    },
    {
      header: 'Title',
      cell: (trial) => (
        <Typography noWrap variant="body2" fontWeight="medium">
          {trial.title}
        </Typography>
      ),
    },
    {
      header: 'Slug',
      cell: (trial) => (
        <Typography variant="caption" fontFamily="monospace" noWrap>
          {trial.slug}
        </Typography>
      ),
    },
    {
      header: 'Updated At',
      cell: (trial) => (
        <Typography variant="caption" noWrap>
          {trial.updated_at ? new Date(trial.updated_at).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
  ]

  return (
    <AdminTable
      title="Trial"
      rows={rows}
      columns={columns}
      slug="trial"
      getKey={(trial) => trial.id}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
