'use client'

import { Chip } from '@mui/material'
import StickyBar from '@/components/navbar/sticky-bar'
import { isEvolutionVisible, isGlowup, matchesObtainedFilter } from '@/hooks/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

const STANDALONE_SLUG = 'standalone_pieces'

export default function OutfitResultsBar({
  baseEvolutionOnly = false,
}: {
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
    selectedStyle,
    selectedLabel,
    selectedSeason,
    selectedSeasonCategory,
  } = filters

  // Mirror filter-outfits: grouped mode applies the obtained filter per evolution
  // group (missing / obtained); ungrouped applies it per variant.
  const groupLevelObtained = groupBySet

  const filtered = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => {
      if (!selectedRarity) return true
      // Standalone is a mixed bag: keep it if any of its pieces match the rarity.
      // Every other set has a single set-level rarity.
      if (set.slug === STANDALONE_SLUG) {
        return set.outfit_variants.some((v) => v.rarity === selectedRarity)
      }
      return set.rarity === selectedRarity
    })
    .filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
    .filter(
      (set) =>
        !selectedLabel.length || selectedLabel.some((l) => l === set.label || l === set.label_2)
    )
    .filter((set) => !selectedSeason.length || selectedSeason.includes(set.seasons ?? ''))
    .filter(
      (set) =>
        !selectedSeasonCategory.length || selectedSeasonCategory.includes(set.season_category ?? '')
    )
    .map((set) => {
      const baseSlug = set.slug
      const orderByStateSlug = new Map<string, number>([
        [baseSlug, 1],
        ...set.evolutions.map((e) => [e.slug, e.order] as [string, number]),
      ])
      // Group-level obtained state is judged over the FULL group (after only the
      // structural filters), so the category filter narrows display without
      // affecting completion — mirrors filter-outfits.
      const scoped = baseEvolutionOnly
        ? set.outfit_variants.filter((v) => v.outfit_set === baseSlug)
        : set.outfit_variants
            .filter((v) => {
              const evo = set.evolutions.find((e) => e.slug === v.outfit_set) ?? null
              return isEvolutionVisible({
                stateSlug: v.outfit_set,
                baseSlug,
                isGlowupState: !!evo && isGlowup(evo),
                hideEvolutions,
                hideGlowups,
              })
            })
            .filter(
              // selectedEvolution is null for "any" and 0 for glow-up, so compare to
              // null explicitly — `!selectedEvolution` would treat glow-up as no filter.
              (v) =>
                selectedEvolution === null ||
                orderByStateSlug.get(v.outfit_set ?? '') === selectedEvolution
            )
      const inMatchingGroup =
        groupLevelObtained && selectedObtainedFilter
          ? scoped.filter((v) => {
              const group = scoped.filter((g) => g.outfit_set === v.outfit_set)
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
        // Standalone is a mixed bag: when a rarity is selected, show only the
        // matching pieces. Other sets are single-rarity, so this is a no-op for them.
        .filter(
          (v) => !selectedRarity || set.slug !== STANDALONE_SLUG || v.rarity === selectedRarity
        )
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
        const groupKeys = new Set(set.outfit_variants.map((v) => v.outfit_set))
        return sum + groupKeys.size
      }, 0)
    }
    return filtered.reduce((sum, set) => sum + set.outfit_variants.length, 0)
  }

  const resultsCount = countResults()

  return (
    <StickyBar>
      <Chip
        color="secondary"
        label={`Showing: ${resultsCount} results`}
        sx={{ backgroundColor: 'surface.mainHover', backdropFilter: 'blur(8px)' }}
        variant="outlined"
      />
    </StickyBar>
  )
}
