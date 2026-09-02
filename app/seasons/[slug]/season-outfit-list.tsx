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
import MakeupVariantCard from '@/app/makeup/makeup-variant-card'
import { useSeasonFilter } from './season-filter-context'
import {
  countEntries,
  countEntryCards,
  countEntryKinds,
  groupSeasonEntries,
  OTHER_CATEGORY,
  SeasonEntry,
} from './season-entries'

// What a category is made of, in the same shape the seasons index card uses for
// its category rows: a count of outfits then a count of pieces, each behind the
// same icon and aria label. Counts come from the entries the header already
// measures, so the visibility toggles move these and the progress readout
// together — the composition always describes the cards actually shown.
//
// Makeup counts as pieces, not outfits, matching the overview's split above:
// the outfit number is about outfit sets specifically, and everything else a
// season hands you — standalone outfit variants and makeup alike — is a piece.
//
// One difference from the index is deliberate: the index counts base sets,
// while these count cards, so a set showing its evolutions contributes one per
// visible state. This header sits directly above those cards and moves with the
// evolution / glow-up / base-set toggles, so counting anything else would
// describe a grid the reader is not looking at.
function CompositionCounts({
  outfits,
  pieces,
  obtainedOutfits,
  obtainedPieces,
}: {
  outfits: number
  pieces: number
  obtainedOutfits: number
  obtainedPieces: number
}) {
  if (outfits === 0 && pieces === 0) return null

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {outfits > 0 && (
        <Typography
          aria-label={`${obtainedOutfits} of ${outfits} ${outfits === 1 ? 'outfit' : 'outfits'} collected`}
          color="text.secondary"
          size="small"
          variant="body"
        >
          {obtainedOutfits}/{outfits} outfits
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
  outfits,
  pieces,
  obtainedOutfits,
  obtainedPieces,
  isLoggedIn,
}: {
  title: string
  obtained: number
  total: number
  outfits: number
  pieces: number
  obtainedOutfits: number
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
              obtainedOutfits={obtainedOutfits}
              obtainedPieces={obtainedPieces}
              outfits={outfits}
              pieces={pieces}
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
      // The same card the /makeup compact view renders, so a makeup piece looks
      // and behaves identically in both places — including a working obtained
      // toggle, which the seasons layout's MakeupDataProvider backs.
      return (
        <MakeupVariantCard
          key={entry.key}
          isLoggedIn={isLoggedIn}
          makeupVariant={entry.variant}
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
        // Cards, not variants — matches the outfits/pieces chips beside it.
        const { obtained, total } = countEntryCards(entries)
        const kinds = countEntryKinds(entries)

        // Set cards and piece cards are different shapes — a set card carries a
        // poster image and title block, a piece card is a small square — so they
        // get a grid each rather than sharing one. In a single grid the column
        // width is set by the widest card, which left every piece floating in an
        // oversized cell. Each grid also uses its own family's preset: the wider
        // `outfit` columns for sets, the denser `eureka` ones for pieces.
        const setEntries = entries.filter((entry) => entry.kind === 'outfit')
        const pieceEntries = entries.filter((entry) => entry.kind !== 'outfit')

        const header = (
          <CardGridHeader
            title={
              <CategoryProgress
                isLoggedIn={isLoggedIn}
                obtained={obtained}
                obtainedOutfits={kinds.obtained.outfit}
                obtainedPieces={kinds.obtained.standalone}
                outfits={kinds.outfit}
                pieces={kinds.standalone}
                title={category === OTHER_CATEGORY ? OTHER_CATEGORY : categoryTitle(category)}
                total={total}
              />
            }
          />
        )

        return (
          <Stack key={category} spacing={2}>
            {setEntries.length > 0 && (
              <CardGrid columns="outfit" header={header}>
                {setEntries.map(renderEntry)}
              </CardGrid>
            )}
            {/* The header belongs to the category, not to either grid, so it
                rides on whichever comes first. */}
            {pieceEntries.length > 0 && (
              <CardGrid columns="eureka" header={setEntries.length === 0 ? header : undefined}>
                {pieceEntries.map(renderEntry)}
              </CardGrid>
            )}
          </Stack>
        )
      })}
    </Stack>
  )
}
