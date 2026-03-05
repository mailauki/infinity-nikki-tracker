'use client'

import { IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlug } from '@/lib/utils'
import { Trial } from '@/lib/types/eureka'
import { AdminTable, Column } from './admin-table'

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
    header: 'Image URL',
    cellSx: { maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' },
    cell: (trial) => (
      <Typography variant="caption" fontFamily="monospace" noWrap>
        {trial.image_url}
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
      title="Trials"
      rows={rows}
      columns={columns}
      addHref="/trial/new"
      addLabel="Add Trial"
      getKey={(trial) => trial.id}
    />
  )
}
