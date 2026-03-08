'use client'

import { Avatar, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlug } from '@/lib/utils'
import { Trial } from '@/lib/types/eureka'
import { AdminTable, Column } from './admin-table'
import { Category } from '@mui/icons-material'

type Row = Trial

const columns: Column<Row>[] = [
  {
    header: 'Edit',
    cellSx: { py: 0 },
    cell: (trial) => (
      <Tooltip title={`Edit ${trial.title}`}>
        <IconButton
          size="small"
          color="secondary"
          href={`/trial/edit/${trial.slug ?? toSlug(trial.title)}`}
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
  { header: 'ID', cell: (trial) => trial.id },
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

export function TrialTable({ rows }: { rows: Row[] }) {
  return (
    <AdminTable
      title="Trial"
      rows={rows}
      columns={columns}
      slug="trial"
      getKey={(trial) => trial.id}
    />
  )
}
