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
            color="secondary"
            href={`/trial/edit/${trial.slug ?? toSlug(trial.title)}${backParam}`}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      header: 'Image',
      cell: (trial) => (
        <Avatar
          alt={trial.title || 'Image'}
					color='transparent'
          size="xs"
          src={trial.image_url!}
          sx={{ width: 40 }}
          variant="rounded"
        >
          <Category fontSize="inherit" />
        </Avatar>
      ),
    },
    {
      header: 'Title',
      cell: (trial) => (
        <Typography noWrap fontWeight="medium" variant="body2">
          {trial.title}
        </Typography>
      ),
    },
    {
      header: 'Slug',
      cell: (trial) => (
        <Typography noWrap fontFamily="monospace" variant="caption">
          {trial.slug}
        </Typography>
      ),
    },
    {
      header: 'Updated At',
      cell: (trial) => (
        <Typography noWrap variant="caption">
          {trial.updated_at ? new Date(trial.updated_at).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
  ]

  return (
    <AdminTable
      columns={columns}
      getKey={(trial) => trial.id}
      page={page}
      rows={rows}
      rowsPerPage={rowsPerPage}
      slug="trial"
      title="Trial"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
