'use client'

import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant, SeasonCategory } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import CardGrid, { CardGridHeader } from '@/components/card-grid'
import ProgressChip from '@/components/progress-chip'
import { percent } from '@/hooks/count-obtained'
import OutfitSetCard from '@/app/outfits/outfit-set-card'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import MakeupSetCard from './makeup-set-item'
import { useSeasonFilter } from './season-filter-context'
import { countEntries, groupSeasonEntries, OTHER_CATEGORY, SeasonEntry } from './season-entries'

// The per-category header: title and obtained/total on one line, with a
// determinate bar beneath. Mirrors the "Hierarchy Progress" rows on the profile
// charts, which are already exactly this readout.
function CategoryProgress({
  title,
  obtained,
  total,
  isLoggedIn,
}: {
  title: string
  obtained: number
  total: number
  isLoggedIn: boolean
}) {
  const percentage = total > 0 ? percent(obtained, total) : 0

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="h2" variant="subtitle1">
          {title}
        </Typography>
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>
      {isLoggedIn && (
        <LinearProgress
          aria-label={`${title} progress`}
          sx={{ mt: 1 }}
          value={percentage}
          variant="determinate"
        />
      )}
    </Box>
  )
}

export default function SeasonOutfitList({
  seasonSets,
  standaloneVariants,
  makeupSets,
  seasonCategories,
  isLoggedIn,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  seasonCategories: SeasonCategory[]
  isLoggedIn: boolean
}) {
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets } = useSeasonFilter()
  const { obtainedOutfit } = useOutfitData()

  const categoryTitle = (categorySlug: string) =>
    seasonCategories.find((sc) => sc.slug === categorySlug)?.title ?? categorySlug

  // Cards currently visible, grouped by season_category — respects every toggle
  // (base sets, evolutions, glow-ups, pieces, makeup). Each category's progress is
  // measured from these same entries, so a header always describes what is shown.
  const categoryGroups = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    hideEvolutions,
    hideGlowups,
    hidePieces,
    hideMakeup,
    hideBaseSets,
    obtainedOutfit,
  })

  if (!categoryGroups.length) {
    return <Typography color="text.secondary">Nothing in this season yet.</Typography>
  }

  const renderEntry = (entry: SeasonEntry) => {
    if (entry.kind === 'standalone') {
      return (
        <OutfitVariantCard key={entry.key} isLoggedIn={isLoggedIn} outfitVariant={entry.variant} />
      )
    }

    if (entry.kind === 'makeup') {
      return (
        <MakeupSetCard
          key={entry.key}
          evolution={entry.evolution}
          isLoggedIn={isLoggedIn}
          set={entry.set}
          variants={entry.variants}
        />
      )
    }

    const { obtained, total } = countEntries([entry])
    return (
      <OutfitSetCard
        key={entry.key}
        evolution={entry.evolution}
        isLoggedIn={isLoggedIn}
        obtained={obtained}
        set={entry.set}
        total={total}
        variants={entry.variants}
      />
    )
  }

  return (
    <Stack spacing={4}>
      {categoryGroups.map(([category, entries]) => {
        const { obtained, total } = countEntries(entries)

        return (
          <CardGrid
            key={category}
            columns="outfit"
            header={
              <CardGridHeader
                title={
                  <CategoryProgress
                    isLoggedIn={isLoggedIn}
                    obtained={obtained}
                    title={category === OTHER_CATEGORY ? OTHER_CATEGORY : categoryTitle(category)}
                    total={total}
                  />
                }
              />
            }
          >
            {entries.map(renderEntry)}
          </CardGrid>
        )
      })}
    </Stack>
  )
}
