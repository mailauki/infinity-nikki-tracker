'use client'

import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { SimpleGrid } from '@/components/card-grid'
import { percent } from '@/hooks/count-obtained'
import { countEntries, countEntryKinds, groupSeasonEntries } from './season-entries'

// One figure in the overview row. Kept local rather than reusing admin's
// StatCard: that one is built around an integer count plus add/list links,
// while these cells carry a formatted value and a caption.
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography component="p" variant="h4">
        {value}
      </Typography>
      <Typography color="text.secondary" variant="overline">
        {label}
      </Typography>
    </Stack>
  )
}

/**
 * The season's shape at a glance, above the category sections: overall progress,
 * how many categories are fully collected, and what the season is made of.
 *
 * Totals are always measured with the evolution / glow-up toggles OFF, so the
 * numbers describe the season itself rather than the current view — matching the
 * per-category chips.
 */
export default function SeasonOverview({
  seasonSets,
  standaloneVariants,
  makeupSets,
  isLoggedIn,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  isLoggedIn: boolean
}) {
  const { obtainedOutfit } = useOutfitData()

  const groups = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    hideEvolutions: false,
    hideGlowups: false,
    obtainedOutfit,
  })

  const entries = groups.flatMap(([, groupEntries]) => groupEntries)
  const { obtained, total } = countEntries(entries)
  const kinds = countEntryKinds(entries)

  const completeCategories = groups.filter(([, groupEntries]) => {
    const counts = countEntries(groupEntries)
    return counts.total > 0 && counts.obtained === counts.total
  }).length

  const percentage = total > 0 ? percent(obtained, total) : 0

  return (
    <Box sx={{ py: 1 }}>
      <SimpleGrid columns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }} sx={{ rowGap: 2 }}>
        {isLoggedIn ? (
          <Stat label="Collected" value={`${percentage}%`} />
        ) : (
          <Stat label="Items" value={String(total)} />
        )}
        {isLoggedIn && (
          <Stat label="Categories done" value={`${completeCategories}/${groups.length}`} />
        )}
        {!isLoggedIn && <Stat label="Categories" value={String(groups.length)} />}
        <Stat label="Outfit sets" value={String(kinds.outfit)} />
        <Stat label="Pieces" value={String(kinds.standalone + kinds.makeup)} />
      </SimpleGrid>

      {isLoggedIn && (
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          <LinearProgress
            aria-label="Season collection progress"
            value={percentage}
            variant="determinate"
          />
          <Typography color="text.secondary" variant="caption">
            {obtained} of {total} collected
          </Typography>
        </Stack>
      )}
    </Box>
  )
}
