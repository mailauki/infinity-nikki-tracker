'use client'

import { IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toEurekaSlug } from '@/lib/utils'
import { AdminTable, Column } from './admin-table'

type Row = {
  id: number
  slug: string | null
  name: string
  quality: number | null
  style: string | null
  labels: string | null
  trial: string | null
  updated_at: string | null
}

const columns: Column<Row>[] = [
  {
    header: 'Edit',
    cellSx: { py: 0 },
    cell: (set) => (
      <Tooltip title={`Edit ${set.name}`}>
        <IconButton
          size="small"
          color="secondary"
          href={`/eureka-set/edit/${set.slug ?? toEurekaSlug(set.name)}`}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
  { header: 'ID', cell: (set) => set.id },
  {
    header: 'Name',
    cell: (set) => (
      <Typography noWrap variant="body2" fontWeight="medium">
        {set.name}
      </Typography>
    ),
  },
  {
    header: 'Slug',
    cell: (set) => (
      <Typography variant="caption" fontFamily="monospace" noWrap>
        {set.slug}
      </Typography>
    ),
  },
  { header: 'Quality', cell: (set) => set.quality },
  { header: 'Style', cell: (set) => set.style },
  { header: 'Labels', cell: (set) => set.labels },
  {
    header: 'Trial',
    cell: (set) => (
      <Typography variant="body2" noWrap>
        {set.trial}
      </Typography>
    ),
  },
  {
    header: 'Updated',
    cell: (set) => (
      <Typography variant="caption" noWrap>
        {set.updated_at ? new Date(set.updated_at).toLocaleDateString() : '—'}
      </Typography>
    ),
  },
]

export function EurekaSetTable({ rows }: { rows: Row[] }) {
  return (
    <AdminTable
      title="Eureka Sets"
      rows={rows}
      columns={columns}
      addHref="/eureka-set/new"
      addLabel="Add Eureka Set"
      getKey={(set) => set.id}
    />
  )
}
