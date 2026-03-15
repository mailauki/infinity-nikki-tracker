'use client'

import { Avatar, Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { toSlug } from '@/lib/utils'
import { AdminTable, Column } from './admin-table'
import { EurekaSet } from '@/lib/types/eureka'
import { Category } from '@mui/icons-material'
import { useSearchParams } from 'next/navigation'

type Row = EurekaSet

interface EurekaSetTableProps {
  rows: Row[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  back?: string
}

export function EurekaSetTable({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  back,
}: EurekaSetTableProps) {
  const searchParams = useSearchParams()
  const backUrl = back ?? (searchParams.toString() ? `/dashboard?${searchParams.toString()}` : '')
  const backParam = backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''

  const columns: Column<Row>[] = [
    {
      header: 'Edit',
      cellSx: { py: 0 },
      cell: (set) => (
        <Tooltip title={`Edit ${set.title}`}>
          <IconButton
            color="secondary"
            href={`/eureka-set/edit/${set.slug ?? toSlug(set.title)}${backParam}`}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      header: 'Image',
      cell: (set) => (
        <Avatar
          alt={set.title || 'Image'}
          size="xs"
          src={set.image_url!}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </Avatar>
      ),
    },
    {
      header: 'Title',
      cell: (set) => (
        <Typography noWrap fontWeight="medium" variant="body2">
          {set.title}
        </Typography>
      ),
    },
    {
      header: 'Slug',
      cell: (set) => (
        <Typography noWrap fontFamily="monospace" variant="caption">
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
            ? set.colors.map((color) => <Chip key={color.slug} label={color.title} size="small" />)
            : '—'}
        </Box>
      ),
    },
    {
      header: 'Trial',
      cell: (set) => (
        <Typography noWrap variant="body2">
          {set.trials?.title ?? set.trial ?? '—'}
        </Typography>
      ),
    },
    {
      header: 'Updated',
      cell: (set) => (
        <Typography noWrap variant="caption">
          {set.updated_at ? new Date(set.updated_at).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
  ]

  return (
    <AdminTable
      columns={columns}
      getKey={(set) => set.id}
      page={page}
      rows={rows}
      rowsPerPage={rowsPerPage}
      slug="eureka-set"
      title="Eureka Set"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
