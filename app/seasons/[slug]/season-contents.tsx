'use client'

import { useEffect } from 'react'
import { Box, List, ListItemButton, Typography } from '@mui/material'
import CompositionCounts, { COMPOSITION_CONTAINER } from '@/components/seasons/composition-counts'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant, SeasonCategory } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SidebarBody from '@/components/sidebar/sidebar-body'
import { useSeasonFilter } from './season-filter-context'
import {
  applySeasonFilters,
  countEntryKinds,
  groupSeasonEntries,
  OTHER_CATEGORY,
} from './season-entries'
import { seasonSectionId } from './season-outfit-list'

/**
 * A clickable table of contents for the season page's category sections. Derives
 * its rows from the exact same groupSeasonEntries + applySeasonFilters call
 * SeasonOutfitList renders from, so a category hidden by a visibility toggle or
 * a filter axis disappears from the TOC at the same moment it disappears from
 * the grid — there is no separate list to fall out of sync.
 */
export default function SeasonContents({
  seasonSets,
  standaloneVariants,
  makeupSets,
  seasonSlug,
  seasonCategories,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  seasonSlug: string
  seasonCategories: SeasonCategory[]
}) {
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets, filters } =
    useSeasonFilter()
  const { obtainedOutfit } = useOutfitData()
  const { obtainedMakeup } = useMakeupData()
  const { activePanel, setActivePanel } = useSidebar()

  // The season page mounts two panelId'd SidebarBodys (this one, plus
  // FilterMenu's "filters" panel) sharing one sidebar, gated on activePanel.
  // activePanel starts null, but the sidebar can already be open on arrival —
  // its cookie persists across routes, so navigating here from e.g. an outfit
  // set-detail page (sidebar open, no activePanel) used to render an open,
  // empty drawer until the user clicked Contents or Filters. Defaulting to
  // "contents" once on mount (only when nothing has claimed the panel yet)
  // fixes that without fighting an explicit choice: an already-active panel
  // (e.g. the user had "filters" open on a previous season visit) is left
  // alone, and the null check keeps this from firing more than once.
  useEffect(() => {
    if (activePanel === null) setActivePanel('contents')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categoryTitle = (categorySlug: string) =>
    seasonCategories.find((sc) => sc.slug === categorySlug)?.title ?? categorySlug

  const categoryGroups = applySeasonFilters(
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
  )

  const scrollToCategory = (category: string) => {
    document.getElementById(seasonSectionId(category))?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <SidebarBody panelId="contents">
      <List>
        <Typography
          color="text.secondary"
          component="p"
          size="small"
          sx={{ px: 2, py: 1 }}
          variant="label"
        >
          Contents
        </Typography>
        {categoryGroups.map(([category, entries]) => {
          const kinds = countEntryKinds(entries)
          const title = category === OTHER_CATEGORY ? OTHER_CATEGORY : categoryTitle(category)

          return (
            <ListItemButton key={category} onClick={() => scrollToCategory(category)}>
              <Box sx={{ ...COMPOSITION_CONTAINER, width: '100%' }}>
                <Typography component="span" variant="body">
                  {title}
                </Typography>
                <CompositionCounts outfits={kinds.outfit} pieces={kinds.standalone} />
              </Box>
            </ListItemButton>
          )
        })}
      </List>
    </SidebarBody>
  )
}
