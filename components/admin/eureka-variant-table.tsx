'use client'

import { Chip, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toEurekaVariantSlug } from '@/lib/utils'
import { AdminTable, Column } from './admin-table'

type Row = {
  id: number
  slug: string | null
  eureka_set: string | null
  category: string | null
  color: string | null
  image_url: string | null
  default: boolean
  updated_at: string | null
}

const columns: Column<Row>[] = [
  {
    header: 'Edit',
    cellSx: { py: 0 },
    cell: (v) => (
      <Tooltip
        title={`Edit ${[v.eureka_set, v.category, v.color].filter(Boolean).join(' • ')}`}
      >
        <IconButton
          size="small"
          color="secondary"
          href={`/eureka-variant/edit/${v.slug ?? toEurekaVariantSlug(v.eureka_set ?? '', v.category ?? '', v.color ?? '')}`}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
  { header: 'ID', cell: (v) => v.id },
  {
    header: 'Eureka Set',
    cell: (v) => (
      <Typography noWrap variant="body2" fontWeight="medium">
        {v.eureka_set}
      </Typography>
    ),
  },
  {
    header: 'Slug',
    cell: (v) => (
      <Typography noWrap variant="caption" fontFamily="monospace">
        {v.slug}
      </Typography>
    ),
  },
  { header: 'Category', cell: (v) => v.category },
  { header: 'Color', cell: (v) => v.color },
  {
    header: 'Image URL',
    cellSx: { maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' },
    cell: (v) => (
      <Typography variant="caption" fontFamily="monospace" noWrap>
        {v.image_url}
      </Typography>
    ),
  },
  {
    header: 'Default',
    cell: (v) =>
      v.default ? (
        <Chip label="default" size="small" color="secondary" variant="outlined" />
      ) : null,
  },
  {
    header: 'Updated',
    cell: (v) => (
      <Typography variant="caption" noWrap>
        {v.updated_at ? new Date(v.updated_at).toLocaleDateString() : '—'}
      </Typography>
    ),
  },
]

export function EurekaVariantTable({ rows }: { rows: Row[] }) {
  return (
    <AdminTable
      title="Eureka Variants"
      rows={rows}
      columns={columns}
      addHref="/eureka-variant/new"
      addLabel="Add Eureka Variant"
      getKey={(v) => v.id}
    />
  )
}
