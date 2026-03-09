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
            size="small"
            color="secondary"
            href={`/eureka-set/edit/${set.slug ?? toSlug(set.title)}${backParam}`}
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

  return (
    <AdminTable
      title="Eureka Set"
      rows={rows}
      columns={columns}
      slug="eureka-set"
      getKey={(set) => set.id}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
