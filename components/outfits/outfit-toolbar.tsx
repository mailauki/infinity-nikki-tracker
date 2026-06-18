'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import { isEvolutionVisible, matchesObtainedFilter } from '@/hooks/outfit'
import { useOutfitData } from './outfit-context'
import { useOutfitImageMode } from './outfit-image-mode-context'

export default function OutfitToolBar({
  showFilters = true,
  baseEvolutionOnly = false,
}: {
  showFilters?: boolean
  baseEvolutionOnly?: boolean
}) {
  const { outfitSets, groupBySet, hideEvolutions, hideGlowups, filters } = useOutfitData()
  const { density } = useOutfitImageMode()

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  // Mirror filter-outfits: grouped mode applies the obtained filter per evolution
  // group (missing / obtained); ungrouped applies it per variant.
  const groupLevelObtained = groupBySet

  const filtered = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      const orderBySlug = new Map(set.evolutions.map((e) => [e.slug, e.order]))
      const baseEvoSlug = `${set.slug}-base`
      // Group-level obtained state is judged over the FULL group (after only the
      // structural filters), so the category filter narrows display without
      // affecting completion — mirrors filter-outfits.
      const scoped = baseEvolutionOnly
        ? set.outfit_variants.filter((v) => v.evolution === baseEvoSlug)
        : set.outfit_variants
            .filter((v) =>
              isEvolutionVisible({
                evolutionSlug: v.evolution,
                baseSlug: baseEvoSlug,
                glowupSlug: set.glowup_evolution,
                hideEvolutions,
                hideGlowups,
              })
            )
            .filter(
              (v) =>
                !selectedEvolution ||
                (!!v.evolution && orderBySlug.get(v.evolution) === selectedEvolution)
            )
      const inMatchingGroup =
        groupLevelObtained && selectedObtainedFilter
          ? scoped.filter((v) => {
              const group = scoped.filter((g) => g.evolution === v.evolution)
              return matchesObtainedFilter(group, selectedObtainedFilter)
            })
          : scoped
      const culled = inMatchingGroup
        .filter(
          (v) =>
            selectedOutfitCategory.length === 0 ||
            (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
        )
        .filter((v) => {
          if (groupLevelObtained) return true
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        })
      return { outfit_variants: culled }
    })
    .filter((set) => set.outfit_variants.length > 0)

  // Count what is actually rendered:
  // - Group-by-set (compact) renders one section per set, so count sets.
  // - Standard density renders one card per (set, evolution) group that has
  //   variants. Variants hidden by the evolution/glowup/obtained filters are
  //   already pruned from `filtered`, so each distinct surviving evolution is
  //   exactly one rendered card.
  // - Otherwise compact density renders one card per variant, so count variants.
  function countResults() {
    if (groupLevelObtained && density === 'compact') return filtered.length
    if (density === 'standard') {
      return filtered.reduce((sum, set) => {
        const groupKeys = new Set(set.outfit_variants.map((v) => v.evolution))
        return sum + groupKeys.size
      }, 0)
    }
    return filtered.reduce((sum, set) => sum + set.outfit_variants.length, 0)
  }

  const resultsCount = countResults()

  return (
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{
          width: '100%',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {resultsCount} results
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'relative', width: '88px', height: '40px' }}
        >
          <SortButton />
          {showFilters && <FilterMenu />}
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}
