'use client'

import { Chip, Stack } from '@mui/material'

import StickyBar from '@/components/navbar/sticky-bar'
import ProgressChip from '@/components/progress-chip'

import { useMomoCloakData } from './momo-cloak-context'
import { useVisibleCloaks } from './use-visible-cloaks'

export default function MomoCloakResultsBar() {
  const { cloaks, obtainedSlugs, isLoggedIn, isObtainedError, isError } = useMomoCloakData()
  const visible = useVisibleCloaks()

  // Nothing to report when the fetch failed — the grid renders an ErrorAlert in
  // place of results, so "Showing: 0 results" would just restate the failure.
  if (isError) return null

  const obtainedCount = cloaks.filter((cloak) => obtainedSlugs.has(cloak.slug)).length

  return (
    <StickyBar>
      <Stack
        direction="row"
        spacing={1}
        sx={{ flexGrow: 1, justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Chip
          color="secondary"
          label={`Showing: ${visible.length} results`}
          sx={{ backgroundColor: 'surface.mainHover', backdropFilter: 'blur(8px)' }}
          variant="outlined"
        />
        {isLoggedIn && !isObtainedError && (
          <ProgressChip obtained={obtainedCount} size="sm" total={cloaks.length} />
        )}
      </Stack>
    </StickyBar>
  )
}
