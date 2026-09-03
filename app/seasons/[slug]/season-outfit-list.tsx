'use client'

import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import CompositionCounts, { COMPOSITION_CONTAINER } from '@/components/seasons/composition-counts'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant, SeasonCategory, SeasonGroup } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import CardGrid, { CardGridHeader } from '@/components/card-grid'
import ProgressChip from '@/components/progress-chip'
import { percent } from '@/hooks/count-obtained'
import OutfitSetCard from '@/app/outfits/outfit-set-card'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import MakeupVariantCard from '@/app/makeup/makeup-variant-card'
import { useSeasonFilter } from './season-filter-context'
import { useSortOrder } from '@/components/sort-context'
import {
  applySeasonFilters,
  countEntries,
  countEntryCards,
  countEntryKinds,
  groupCategoriesBySeasonGroup,
  groupSeasonEntries,
  OTHER_CATEGORY,
  SeasonEntry,
  sortSeasonEntries,
} from './season-entries'

/** Anchor id for a category's section. Shared with the contents sidebar so the
 *  link target and the rendered section can never drift apart. */
export function seasonSectionId(category: string) {
  return `season-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

/** Anchor id for a season_group's run of categories. Same contract as
 *  seasonSectionId — the contents sidebar links at it. */
export function seasonGroupSectionId(group: string) {
  return `season-group-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
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
    <Box sx={{ ...COMPOSITION_CONTAINER, width: '100%' }}>
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
  seasonGroups,
  isLoggedIn,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  seasonSlug: string
  seasonCategories: SeasonCategory[]
  seasonGroups: SeasonGroup[]
  isLoggedIn: boolean
}) {
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets, filters } =
    useSeasonFilter()
  const { obtainedOutfit } = useOutfitData()
  const { obtainedMakeup } = useMakeupData()
  const { sortAxis, sortDir } = useSortOrder()

  const categoryTitle = (categorySlug: string) =>
    seasonCategories.find((sc) => sc.slug === categorySlug)?.title ?? categorySlug

  // Cards currently visible, grouped by season_category — respects every toggle
  // (base sets, evolutions, glow-ups, pieces, makeup) plus the obtained/rarity/
  // style filter axes. Each category's progress is measured from these same
  // entries, so a header always describes what is shown — and a category every
  // one of whose entries fails the active filter drops out of both the grid and
  // the contents sidebar, which derives from this same call.
  const categoryGroups = sortSeasonEntries(
    applySeasonFilters(
      groupSeasonEntries({
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
        obtainedMakeup,
      }),
      filters
    ),
    sortAxis,
    sortDir
  )

  if (!categoryGroups.length) {
    return <Typography color="text.secondary">Nothing in this season yet.</Typography>
  }

  // Fold the visible categories into their season_group runs. A season with no
  // grouped categories yields one null-group section, which renders exactly as
  // the page did before groups existed.
  const sections = groupCategoriesBySeasonGroup(categoryGroups, seasonCategories, seasonGroups)

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
        <MakeupVariantCard key={entry.key} isLoggedIn={isLoggedIn} makeupVariant={entry.variant} />
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

  const renderCategory = ([category, entries]: [string, SeasonEntry[]]) => {
    // Cards, not variants — matches the outfits/pieces chips beside it.
    //
    // These count the cards actually rendered below, so a set showing its
    // evolutions contributes one per visible state and the numbers move with
    // the visibility toggles. The seasons index instead counts a season's
    // full contents regardless of toggles, so with evolutions shown a
    // category reads higher here than it does there.
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
      <Stack key={category} id={seasonSectionId(category)} spacing={2} sx={{ scrollMarginTop: 72 }}>
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
  }

  return (
    <Stack spacing={4}>
      {sections.map((section, index) =>
        section.group ? (
          <Stack
            key={`${section.group.slug}-${index}`}
            id={seasonGroupSectionId(section.group.slug)}
            spacing={4}
            sx={{ scrollMarginTop: 72, pt: 4 }}
          >
            {/* Same label treatment as the QuickAccess and Helpful Links
                headings (components/quick-access.tsx, app/help/help-actions.tsx):
                a centered small uppercase label. `component="h2"` is the one
                departure — those two are decorative, while this one really does
                open a section, so it keeps its place in the document outline.
                Their `mb: 2` is dropped: the wrapping Stack's spacing={4} already
                separates the heading from the first grid, and keeping both would
                double the gap. */}
            <Typography
              component="h2"
              size="small"
              sx={{ display: 'block', textAlign: 'center', textTransform: 'uppercase' }}
              variant="label"
            >
              {section.group.title}
            </Typography>
            {section.categories.map(renderCategory)}
          </Stack>
        ) : (
          // Ungrouped categories render bare — no heading, no wrapper — so a
          // season that uses no groups looks untouched.
          <Stack key={`ungrouped-${index}`} spacing={4}>
            {section.categories.map(renderCategory)}
          </Stack>
        )
      )}
    </Stack>
  )
}
