'use client'

import { ReactNode } from 'react'
import { Box, Button, Chip, Typography } from '@mui/material'

/**
 * Shared scaffolding for `AdminGapQueue` and `AdminUnassignedPieces`: the
 * filter-chip row, the pagination footer, and the empty-row message. The two
 * callers differ in real ways beyond this — an entity dropdown vs. none,
 * container-shaped rows vs. per-piece rows — so the list itself (the
 * `List`/`ListItem`/`LazyImage`/`ListItemText` rendering) stays duplicated
 * rather than forcing a shared shape onto two genuinely different row types.
 */

export interface GapChipItem<K extends string> {
  kind: K
  label: string
  count: number
  /** Visually de-emphasize this chip (used for the description filter — it never gates queue inclusion). */
  dashed?: boolean
}

export function GapFilterChips<K extends string>({
  active,
  items,
  trailing,
  onChange,
}: {
  active: K
  items: GapChipItem<K>[]
  /** Extra content appended after the chips, e.g. an "Add" button. */
  trailing?: ReactNode
  onChange: (kind: K) => void
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
      {items.map(({ kind, label, count, dashed }) => (
        <Chip
          key={kind}
          color={kind === active ? 'primary' : 'default'}
          label={`${label} ${count.toLocaleString()}`}
          size="small"
          sx={dashed ? { borderStyle: 'dashed', opacity: 0.7 } : undefined}
          variant={kind === active ? 'filled' : 'outlined'}
          onClick={() => onChange(kind)}
        />
      ))}
      {trailing}
    </Box>
  )
}

export function GapEmptyState({ message }: { message: string }) {
  return (
    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }} variant="body">
      {message}
    </Typography>
  )
}

export function GapPaginationFooter({
  currentPage,
  from,
  lastPage,
  to,
  total,
  onNext,
  onPrevious,
}: {
  currentPage: number
  from: number
  lastPage: number
  to: number
  total: number
  onNext: () => void
  onPrevious: () => void
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        gap: 1,
        justifyContent: 'space-between',
        mt: 1.5,
      }}
    >
      <Typography color="text.secondary" size="small" variant="body">
        {from}–{to} of {total.toLocaleString()}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button disabled={currentPage <= 1} size="small" onClick={onPrevious}>
          Previous
        </Button>
        <Button disabled={currentPage >= lastPage} size="small" onClick={onNext}>
          Next
        </Button>
      </Box>
    </Box>
  )
}
