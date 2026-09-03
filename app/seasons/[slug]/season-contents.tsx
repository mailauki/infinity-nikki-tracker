'use client'

import { useEffect } from 'react'
import { List, ListItemButton, ListItemText } from '@mui/material'
import CompositionCounts, { COMPOSITION_CONTAINER } from '@/components/seasons/composition-counts'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant, SeasonCategory, SeasonGroup } from '@/lib/types/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SidebarBody from '@/components/sidebar/sidebar-body'
import { useSeasonFilter } from './season-filter-context'
import { useSortOrder } from '@/components/sort-context'
import {
  applySeasonFilters,
  countEntryKinds,
  groupCategoriesBySeasonGroup,
  groupSeasonEntries,
  OTHER_CATEGORY,
  sortSeasonEntries,
} from './season-entries'
import { seasonGroupSectionId, seasonSectionId } from './season-outfit-list'

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

  // Same fold the grid applies, from the same categoryGroups, so the TOC's
  // headings and the page's sections can never disagree.
  const sections = groupCategoriesBySeasonGroup(categoryGroups, seasonCategories, seasonGroups)

  const scrollToCategory = (category: string) => {
    document.getElementById(seasonSectionId(category))?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToGroup = (group: string) => {
    document.getElementById(seasonGroupSectionId(group))?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <SidebarBody panelId="contents">
      <List dense sx={{ pb: 3 }}>
        {sections.flatMap((section, index) => [
          // A group heading is itself a link, so the sidebar can jump to the run
          // as well as to any category inside it.
          ...(section.group
            ? [
                <ListItemButton
                  key={`group-${section.group.slug}-${index}`}
                  onClick={() => scrollToGroup(section.group!.slug)}
                >
                  <ListItemText
                    primary={section.group.title}
                    slotProps={{
                      primary: {
                        variant: 'label',
                        size: 'small',
                        color: 'secondary',
                        sx: { textTransform: 'uppercase', fontWeight: 'bold' },
                      },
                    }}
                  />
                </ListItemButton>,
              ]
            : []),
          ...section.categories.map(([category, entries]) => {
            const kinds = countEntryKinds(entries)
            const title = category === OTHER_CATEGORY ? OTHER_CATEGORY : categoryTitle(category)

            return (
              <ListItemButton
                key={category}
                // The inline-size container CompositionCounts measures to pick
                // its icon vs word form. It has to sit on the row itself: the
                // season page has no other containerType ancestor, and with none
                // in scope the @container query can never match, which would
                // pin the icon form and make the word form dead code.
                sx={COMPOSITION_CONTAINER}
                onClick={() => scrollToCategory(category)}
              >
                <ListItemText
                  inset
                  primary={title}
                  slotProps={{ primary: { variant: 'body' } }}
                  sx={{ pl: 3 }}
                />
                <CompositionCounts
                  obtainedOutfits={isLoggedIn ? kinds.obtained.outfit : undefined}
                  obtainedPieces={isLoggedIn ? kinds.obtained.standalone : undefined}
                  outfits={kinds.outfit}
                  pieces={kinds.standalone}
                />
              </ListItemButton>
            )
          }),
        ])}
      </List>
    </SidebarBody>
  )
}
