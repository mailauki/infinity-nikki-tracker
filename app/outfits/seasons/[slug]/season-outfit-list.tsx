'use client'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  List,
  Typography,
} from '@mui/material'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant, SeasonCategory } from '@/lib/types/outfit'
import { useSeasonFilter } from './season-filter-context'
import OutfitSetListItem from './outfit-set-item'
import StandalonePieceItem from './standalone-piece-item'
import MakeupSetListItem from './makeup-set-item'
import { ExpandMore } from '@mui/icons-material'
import ProgressChip from '@/components/progress-chip'
import { countEntries, groupSeasonEntries, OTHER_CATEGORY, SeasonEntry } from './season-entries'

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
  const { hideEvolutions, hideGlowups } = useSeasonFilter()

  const categoryTitle = (categorySlug: string) =>
    seasonCategories.find((sc) => sc.slug === categorySlug)?.title ?? categorySlug

  // Rows currently visible, grouped by season_category — respects the evolution
  // and glow-up toggles.
  const categoryGroups = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    hideEvolutions,
    hideGlowups,
  })

  // Category chips report full contents, so a total stays put as the toggles
  // hide rows. Built with both toggles off and read back by category slug.
  const fullTotals = new Map(
    groupSeasonEntries({
      seasonSets,
      standaloneVariants,
      makeupSets,
      hideEvolutions: false,
      hideGlowups: false,
    }).map(([category, entries]) => [category, countEntries(entries)])
  )

  if (!categoryGroups.length) {
    return <Typography color="text.secondary">Nothing in this season yet.</Typography>
  }

  const renderEntry = (entry: SeasonEntry) => {
    if (entry.kind === 'standalone') {
      return <StandalonePieceItem key={entry.key} isLoggedIn={isLoggedIn} variant={entry.variant} />
    }

    if (entry.kind === 'makeup') {
      return (
        <MakeupSetListItem
          key={entry.key}
          evolution={entry.evolution}
          isLoggedIn={isLoggedIn}
          set={entry.set}
          variants={entry.variants}
        />
      )
    }

    return <OutfitSetListItem key={entry.key} entry={entry} isLoggedIn={isLoggedIn} />
  }

  return (
    <>
      {categoryGroups.map(([category, entries]) => {
        const { obtained, total } = fullTotals.get(category) ?? { obtained: 0, total: 0 }

        return (
          <Box key={category}>
            <Accordion variant="filled">
              <AccordionSummary
                aria-controls={`${category}-content`}
                expandIcon={<ExpandMore />}
                id={`${category}-header`}
              >
                <Typography component="span" sx={{ flexGrow: 1 }}>
                  {category === OTHER_CATEGORY ? OTHER_CATEGORY : categoryTitle(category)}
                </Typography>
                {isLoggedIn && (
                  <Box sx={{ mr: 2 }}>
                    <ProgressChip obtained={obtained} total={total} variant="parts" />
                  </Box>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <Divider />
                <List>{entries.map(renderEntry)}</List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )
      })}
    </>
  )
}
