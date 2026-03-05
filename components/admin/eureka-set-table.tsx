'use client'

import { IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlug } from '@/lib/utils'
import { Tables } from '@/lib/types/supabase'
import { AdminTable, Column } from './admin-table'

type Row = Tables<'eureka_sets'>

const columns: Column<Row>[] = [
  {
    header: 'Edit',
    cellSx: { py: 0 },
    cell: (set) => (
      <Tooltip title={`Edit ${set.title}`}>
        <IconButton
          size="small"
          color="secondary"
          href={`/eureka-set/edit/${set.slug ?? toSlug(set.title)}`}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
  { header: 'ID', cell: (set) => set.id },
  {
    header: 'Title',
    cell: (set) => (
      <Typography noWrap variant="body2" fontWeight="medium">
        {set.title}
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
  { header: 'Rarity', cell: (set) => set.rarity },
  { header: 'Style', cell: (set) => set.style },
  { header: 'Label', cell: (set) => set.label },
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
