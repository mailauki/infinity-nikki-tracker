'use client'

import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { SimpleGrid } from '@/components/card-grid'
import { percent } from '@/hooks/count-obtained'
import { useSeasonFilter } from './season-filter-context'
import { countEntryCards, countEntryKinds, groupSeasonEntries } from './season-entries'

// One figure in the overview row. Kept local rather than reusing admin's
// StatCard: that one is built around an integer count plus add/list links,
// while these cells carry a formatted value and a caption.
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography component="p" size="large" variant="headline">
        {value.split('%')[0]}
        {value.includes('%') && (
          <Typography component="span" variant="title">
            %
          </Typography>
        )}
      </Typography>
      <Typography color="text.secondary" size="small" variant="label">
        {label}
      </Typography>
    </Stack>
  )
}

/**
 * The season's shape at a glance, above the category sections: overall progress,
 * how many categories are fully collected, and what the season is made of.
 *
 * Measured from the same visible entries as the category headers, so the toggles
 * move all three readouts (overview, category chips, season chip) together and
 * the page never shows two different denominators for the same content.
 */
export default function SeasonOverview({
  seasonSets,
  standaloneVariants,
  makeupSets,
  seasonSlug,
  isLoggedIn,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  seasonSlug: string
  isLoggedIn: boolean
}) {
  const { obtainedOutfit } = useOutfitData()
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets } = useSeasonFilter()

  const groups = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    seasonSlug,
    hideEvolutions,
    hideGlowups,
    hidePieces,
    hideMakeup,
    hideBaseSets,
    obtainedOutfit,
  })

  const entries = groups.flatMap(([, groupEntries]) => groupEntries)
  const { obtained, total } = countEntryCards(entries)
  const kinds = countEntryKinds(entries)

  const completeCategories = groups.filter(([, groupEntries]) => {
    const counts = countEntryCards(groupEntries)
    return counts.total > 0 && counts.obtained === counts.total
  }).length

  const percentage = total > 0 ? percent(obtained, total) : 0

  return (
    <Card>
      <CardContent>
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
          <Stat label="Outfits" value={String(kinds.outfit)} />
          <Stat label="Pieces" value={String(kinds.standalone)} />
        </SimpleGrid>

        {isLoggedIn && (
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            <LinearProgress
              aria-label="Season collection progress"
              color="tertiary"
              value={percentage}
              variant="determinate"
            />
            <Typography color="text.secondary" size="small" variant="body">
              {obtained} of {total} collected
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
