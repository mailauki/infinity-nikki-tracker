'use client'

import { IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { AdminTable, Column } from './admin-table'

type Row = {
  id: number
  name: string
  image_url: string | null
}

const columns: Column<Row>[] = [
  {
    header: 'Edit',
    cellSx: { py: 0 },
    cell: (trial) => (
      <Tooltip title={`Edit ${trial.name}`}>
        <IconButton size="small" color="secondary" href={`/trial/edit/${trial.id}`}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
  { header: 'ID', cell: (trial) => trial.id },
  {
    header: 'Name',
    cell: (trial) => (
      <Typography noWrap variant="body2" fontWeight="medium">
        {trial.name}
      </Typography>
    ),
  },
  { header: 'Image URL', cell: (trial) => trial.image_url },
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
