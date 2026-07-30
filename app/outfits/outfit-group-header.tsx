'use client'

import { memo } from 'react'
import { ChevronRight, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { Box, Button, Divider, IconButton, Stack } from '@mui/material'
import ProgressChip from '@/components/progress-chip'

// The header for one evolution group (base set or one evolution) in the grouped
// compact view. Extracted from the former OutfitSetSection so the virtualized
// row model can render it as a standalone row.
//
// `obtained` / `total` / `allObtained` are always computed by the caller from
// the FULL, unfiltered group — never from the variants actually displayed — so
// the progress shown here is true set progress rather than the filtered subset.
//
// No `gridColumn: '1 / -1'` here: in the virtualized layout a header occupies
// its own absolutely-positioned row rather than spanning a CSS grid.
function OutfitGroupHeader({
  title,
  href,
  isLoggedIn,
  obtained,
  total,
  allObtained,
  onToggle,
}: {
  title: string
  href: string
  isLoggedIn: boolean
  obtained: number
  total: number
  allObtained: boolean
  onToggle: () => void
}) {
  return (
    <Box sx={{ mt: 1 }}>
      <Stack
        direction="row"
        sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <Button color="inherit" endIcon={<ChevronRight />} href={href} size="small">
          {title}
        </Button>
        {isLoggedIn && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ProgressChip obtained={obtained} total={total} variant="parts" />
            <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <ProgressChip obtained={obtained} size="lg" total={total} />
            </Box>
            <IconButton
              aria-label={allObtained ? 'Mark as not obtained' : 'Mark as obtained'}
              size="small"
              onClick={onToggle}
            >
              {allObtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
            </IconButton>
          </Stack>
        )}
      </Stack>
      <Divider />
    </Box>
  )
}

// Matches the card components: every prop is a primitive except `onToggle`,
// which the virtualized grid rebuilds per render from the row model. Row models
// are memoized on `[sets, columnCount]`, so the closure identity is stable
// across unrelated re-renders.
export default memo(OutfitGroupHeader)
