'use client'

import { List, ListSubheader, Typography } from '@mui/material'
import { OutfitSet, SeasonCategory } from '@/lib/types/outfit'
import { isEvolutionVisible } from '@/hooks/outfit'
import { useSeasonFilter } from './season-filter-context'
import OutfitSetListItem, { OutfitSetListEntry } from './outfit-set-item'

// Expand a set into its base entry plus one entry per evolution (including the
// glow-up). Each entry is rendered as its own list item — the same model as the
// outfits grid, where evolutions and glow-ups stand alongside base sets — and is
// shown or hidden by the evolution / glow-up toggles. The base entry is always
// shown; progress is measured against each entry's own variants.
export function expandSet(
  set: OutfitSet,
  hideEvolutions: boolean,
  hideGlowups: boolean
): OutfitSetListEntry[] {
  const baseEvoSlug = `${set.slug}-base`

  const entries: OutfitSetListEntry[] = [
    {
      key: baseEvoSlug,
      set,
      evolution: null,
      variants: set.outfit_variants.filter((v) => v.evolution === baseEvoSlug),
    },
  ]

  for (const evolution of set.evolutions) {
    const visible = isEvolutionVisible({
      evolutionSlug: evolution.slug,
      baseSlug: baseEvoSlug,
      glowupSlug: set.glowup_evolution,
      hideEvolutions,
      hideGlowups,
    })
    if (!visible) continue

    const variants = set.outfit_variants.filter((v) => v.evolution === evolution.slug)
    if (variants.length === 0) continue

    entries.push({
      key: evolution.slug,
      set,
      evolution,
      variants,
      isGlowup: set.glowup_evolution === evolution.slug,
    })
  }

  return entries
}

export default function SeasonOutfitList({
  seasonSets,
  seasonCategories,
  isLoggedIn,
}: {
  seasonSets: OutfitSet[]
  seasonCategories: SeasonCategory[]
  isLoggedIn: boolean
}) {
  const { hideEvolutions, hideGlowups } = useSeasonFilter()

  const categoryTitle = (categorySlug: string) =>
    seasonCategories.find((sc) => sc.slug === categorySlug)?.title ?? categorySlug

  // Group the sets by their season_category (the season<->category link lives on
  // outfit_sets); sets without a category fall under "Other".
  const categoryGroups = Object.entries(
    seasonSets.reduce<Record<string, OutfitSet[]>>((groups, set) => {
      const category = set.season_category ?? 'Other'
      ;(groups[category] ??= []).push(set)
      return groups
    }, {})
  )

  if (!categoryGroups.length) {
    return <Typography color="text.secondary">No outfit sets in this season yet.</Typography>
  }

  return (
    <>
      {categoryGroups.map(([category, sets]) => (
        <List
          key={category}
          subheader={
            <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>
              {category === 'Other' ? 'Other' : categoryTitle(category)}
            </ListSubheader>
          }
        >
          {sets
            .flatMap((set) => expandSet(set, hideEvolutions, hideGlowups))
            .map((entry) => (
              <OutfitSetListItem key={entry.key} entry={entry} isLoggedIn={isLoggedIn} />
            ))}
        </List>
      ))}
    </>
  )
}
