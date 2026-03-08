'use client'

import { Avatar, Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlug } from '@/lib/utils'
import { AdminTable, Column } from './admin-table'
import { EurekaSet } from '@/lib/types/eureka'
import { Category } from '@mui/icons-material'

type Row = EurekaSet

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
  {
    header: 'Image',
    cell: (set) => (
      <Avatar size="xs" src={set.image_url!} alt={set.title || 'Image'}>
        <Category fontSize="inherit" />
      </Avatar>
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
    header: 'Colors',
    cell: (set) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {set.colors
          ? set.colors.map((color) => <Chip key={color.title} label={color.title} size="small" />)
          : '—'}
      </Box>
    ),
  },
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
