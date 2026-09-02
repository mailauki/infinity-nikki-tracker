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
import MakeupPieceCard from './makeup-piece-item'
import { useSeasonFilter } from './season-filter-context'
import {
  countEntries,
  countEntryKinds,
  groupSeasonEntries,
  OTHER_CATEGORY,
  SeasonEntry,
} from './season-entries'

// What a category is made of, in the same shape the seasons index card uses for
// its category rows: a count of sets then a count of pieces, each behind the
// same icon and aria label. Counts come from the entries the header already
// measures, so the visibility toggles move these and the progress readout
// together — the composition always describes the cards actually shown.
//
// Makeup sets count as sets (they are sets with their own variants), matching
// how the index chips count them.
//
// One difference from the index is deliberate: the index counts base sets,
// while these count cards, so a set showing its evolutions contributes one per
// visible state. This header sits directly above those cards and moves with the
// evolution / glow-up / base-set toggles, so counting anything else would
// describe a grid the reader is not looking at.
function CompositionCounts({
  sets,
  pieces,
  obtainedSets,
  obtainedPieces,
}: {
  sets: number
  pieces: number
  obtainedSets: number
  obtainedPieces: number
}) {
  if (sets === 0 && pieces === 0) return null

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {sets > 0 && (
        <Typography
          aria-label={`${obtainedSets} of ${sets} ${sets === 1 ? 'set' : 'sets'} collected`}
          color="text.secondary"
          size="small"
          variant="body"
        >
          {obtainedSets}/{sets} sets
        </Typography>
      )}
      {pieces > 0 && (
        <Typography
          aria-label={`${obtainedPieces} of ${pieces} ${
            pieces === 1 ? 'piece' : 'pieces'
          } collected`}
          color="text.secondary"
          size="small"
          variant="body"
        >
          {obtainedPieces}/{pieces} pieces
        </Typography>
      )}
    </Stack>
  )
}

// The per-category header: title and obtained/total on one line, with a
// determinate bar beneath. Mirrors the "Hierarchy Progress" rows on the profile
// charts, which are already exactly this readout.
function CategoryProgress({
  title,
  obtained,
  total,
  sets,
  pieces,
  obtainedSets,
  obtainedPieces,
  isLoggedIn,
}: {
  title: string
  obtained: number
  total: number
  sets: number
  pieces: number
  obtainedSets: number
  obtainedPieces: number
  isLoggedIn: boolean
}) {
  const percentage = total > 0 ? percent(obtained, total) : 0

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="h2" size="large" variant="title">
          {title}
        </Typography>
        {isLoggedIn && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CompositionCounts
              obtainedPieces={obtainedPieces}
              obtainedSets={obtainedSets}
              pieces={pieces}
              sets={sets}
            />
            <ProgressChip obtained={obtained} total={total} variant="parts" />
          </Stack>
        )}
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
  seasonSlug,
  seasonCategories,
  isLoggedIn,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  seasonSlug: string
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
    seasonSlug,
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

    if (entry.kind === 'makeup-standalone') {
      return <MakeupPieceCard key={entry.key} variant={entry.variant} />
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
        const kinds = countEntryKinds(entries)

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
                    obtainedPieces={kinds.obtained.standalone}
                    obtainedSets={kinds.obtained.outfit + kinds.obtained.makeup}
                    pieces={kinds.standalone}
                    sets={kinds.outfit + kinds.makeup}
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
