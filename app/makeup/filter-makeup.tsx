'use client'
import { useMemo } from 'react'
import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'

import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useMakeupImageMode } from '@/components/makeup/makeup-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import CardGrid from '@/components/card-grid'
import { matchesObtainedFilter } from '@/hooks/outfit'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import VirtualGroupedGrid from './virtual-grouped-grid'
import VirtualSetGrid, { type SetGridItem } from './virtual-set-grid'
import VirtualVariantGrid from './virtual-variant-grid'

function GroupHeaderSkeleton() {
  return (
    <Box sx={{ gridColumn: '1 / -1' }}>
      <Stack
        direction="row"
        sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <Skeleton height={28} variant="text" width={120} />
        <Skeleton height={24} variant="rounded" width={60} />
      </Stack>
      <Divider />
    </Box>
  )
}

function VariantCardSkeleton() {
  return (
    <Skeleton
      height={0}
      style={{ paddingBottom: '133%' }}
      sx={{ borderRadius: 1 }}
      variant="rectangular"
      width="100%"
    />
  )
}

export default function FilterMakeup() {
  const {
    makeupSets,
    isLoggedIn,
    isLoading,
    isError,
    isObtainedError,
    isFiltering,
    groupBySet,
    filters,
  } = useMakeupData()
  const { density } = useMakeupImageMode()
  const { sortAxis, sortDir } = useSortOrder()
  // Progress sorting needs obtained data; fall back to date when logged out.
  const axis = !isLoggedIn && sortAxis === 'progress' ? 'date' : sortAxis

  const {
    selectedMakeupSet,
    selectedMakeupCategory,
    selectedObtainedFilter,
    selectedRarity,
    selectedStyle,
    selectedLabel,
    selectedSeason,
    selectedSeasonCategory,
  } = filters

  // When grouped, each set renders as one card/header per evolution group (base
  // plus each evolution), so the obtained filter is applied at the GROUP level:
  // 'obtained' = every variant in the group obtained, 'missing' = any group that
  // is not fully complete (none or only some obtained). Variants are kept intact
  // so each group shows true progress. When not grouped, the flat views render
  // one card per variant, so the filter is applied per variant.
  const groupLevelObtained = groupBySet

  type FilteredSet = (typeof makeupSets)[number]

  const filteredSets = useMemo(() => {
    return makeupSets
      .filter((set) => !selectedMakeupSet || set.slug === selectedMakeupSet)
      .filter((set) => {
        if (!selectedRarity) return true
        // The standalone bucket has no rarity of its own — keep it when any of its
        // pieces match, and show only those pieces.
        if (isStandaloneMakeupSet(set)) {
          return set.makeup_variants.some((v) => v.rarity === selectedRarity)
        }
        return set.rarity === selectedRarity
      })
      .filter((set) => !selectedStyle.length || selectedStyle.includes(set.style ?? ''))
      .filter((set) => !selectedLabel.length || selectedLabel.includes(set.label ?? ''))
      .filter((set) => !selectedSeason.length || selectedSeason.includes(set.seasons ?? ''))
      .filter(
        (set) =>
          !selectedSeasonCategory.length ||
          selectedSeasonCategory.includes(set.season_category ?? '')
      )
      .map((set) => {
        // Variants in scope for this set. The group-level obtained state is judged
        // over these — the FULL group — so it reflects true set progress rather
        // than the category-filtered subset. Makeup has no evolution visibility or
        // glow-up axes, so the only structural scoping is the set itself.
        const scopedVariants = set.makeup_variants
        // Group-level obtained filter: drop whole evolution groups whose full-group
        // state doesn't match the selected missing / obtained state.
        let inMatchingGroup = scopedVariants
        if (groupLevelObtained && selectedObtainedFilter) {
          // Group once by state slug, then judge each group a single time, instead of
          // re-scanning every variant for every variant (quadratic per set).
          const byState = new Map<string, typeof scopedVariants>()
          for (const v of scopedVariants) {
            const key = v.makeup_set ?? ''
            const group = byState.get(key)
            if (group) group.push(v)
            else byState.set(key, [v])
          }
          const keptStates = new Set<string>()
          for (const [key, group] of byState) {
            if (matchesObtainedFilter(group, selectedObtainedFilter)) keptStates.add(key)
          }
          inMatchingGroup = scopedVariants.filter((v) => keptStates.has(v.makeup_set ?? ''))
        }
        // Apply the category filter last so it only narrows what is displayed,
        // without affecting the group-level obtained classification above. In
        // ungrouped mode the obtained filter is still per variant. Category
        // filtering reads the fixed five-way `makeupCategories` list from context —
        // every makeup set carries all five categories by design.
        const culledVariants = inMatchingGroup
          .filter(
            (v) =>
              selectedMakeupCategory.length === 0 ||
              (v.makeup_category !== null && selectedMakeupCategory.includes(v.makeup_category))
          )
          .filter((v) => {
            if (groupLevelObtained) return true
            if (selectedObtainedFilter === 'obtained') return v.obtained === true
            if (selectedObtainedFilter === 'missing') return v.obtained !== true
            return true
          })
          // The standalone bucket is a mixed bag: when a rarity is selected, show
          // only the matching pieces. Other sets are single-rarity, so this is a
          // no-op for them.
          .filter(
            (v) => !selectedRarity || !isStandaloneMakeupSet(set) || v.rarity === selectedRarity
          )
        return { ...set, makeup_variants: culledVariants }
      })
      .filter((set) => set.makeup_variants.length > 0)
      .sort((a, b) => {
        // The standalone bucket is a catch-all — always last, regardless of sort
        // axis or direction. Only one bucket exists, so both-standalone never
        // happens.
        if (isStandaloneMakeupSet(a)) return 1
        if (isStandaloneMakeupSet(b)) return -1
        const progress = (s: FilteredSet) => {
          const total = s.makeup_variants.length
          return total === 0 ? 0 : s.makeup_variants.filter((v) => v.obtained).length / total
        }
        let cmp: number
        switch (axis) {
          case 'rarity':
            cmp = a.rarity - b.rarity
            break
          case 'progress':
            cmp = progress(a) - progress(b)
            break
          case 'title':
            cmp = a.title.localeCompare(b.title)
            break
          default:
            cmp = a.id! - b.id!
        }
        // `desc` is the default direction for date/rarity/progress (newest /
        // highest first); for title, `asc` is A→Z. Stable tiebreak on id.
        return (sortDir === 'asc' ? cmp : -cmp) || a.id! - b.id!
      })
  }, [
    makeupSets,
    selectedMakeupSet,
    selectedMakeupCategory,
    selectedObtainedFilter,
    selectedRarity,
    selectedStyle,
    selectedLabel,
    selectedSeason,
    selectedSeasonCategory,
    groupLevelObtained,
    axis,
    sortDir,
  ])

  // The ungrouped compact branch renders one card per variant, so it consumes a
  // flat list rather than sets. Memoized to keep the array identity — and with it
  // the virtualizer's row model — stable across unrelated re-renders.
  const flatVariants = useMemo(
    () => filteredSets.flatMap((set) => set.makeup_variants),
    [filteredSets]
  )

  // The standard branch renders one card per set+evolution group, so it consumes
  // a flat item list rather than sets. Memoized to keep the array identity — and
  // with it the virtualizer's row model — stable across unrelated re-renders.
  const setGridItems = useMemo<SetGridItem[]>(() => {
    const items: SetGridItem[] = []
    for (const set of filteredSets) {
      const baseSlug = set.slug
      // The base set plus each evolution is its own card.
      for (const evolution of [null, ...set.evolutions]) {
        const stateSlug = evolution?.slug ?? baseSlug
        const variants = set.makeup_variants.filter((v) => v.makeup_set === stateSlug)
        // An evolution group whose variants were all culled emits no card.
        if (variants.length === 0) continue
        items.push({
          key: `${set.id}-${stateSlug}`,
          set,
          evolution,
          obtained: variants.filter((v) => v.obtained === true).length,
          total: variants.length,
          variants,
        })
      }
    }
    return items
  }, [filteredSets])

  // No reveal window in any branch any more: all three are virtualized
  // (VirtualSetGrid / VirtualGroupedGrid / VirtualVariantGrid), so the whole
  // result set is always "rendered" and only the rows in view are mounted.

  if (isError) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <ErrorAlert message="Failed to load Makeup data. Please refresh the page." />
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <CardGrid
          columns="outfit"
          header={<Skeleton height={20} sx={{ mt: 2, mb: 0.5 }} variant="text" width={100} />}
        >
          <GroupHeaderSkeleton />
          {Array.from({ length: 5 }).map((_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
          <GroupHeaderSkeleton />
          {Array.from({ length: 4 }).map((_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
          <GroupHeaderSkeleton />
          {Array.from({ length: 3 }).map((_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
        </CardGrid>
      </Box>
    )
  }

  return (
    <>
      {!isLoggedIn && (
        <Box sx={{ width: 'fit-content', my: 2 }}>
          <LoginAlert title="Makeup" />
        </Box>
      )}

      {isObtainedError && (
        <Alert severity="warning" sx={{ width: 'fit-content', my: 2 }}>
          Could not load your collection status. Progress may be inaccurate.
        </Alert>
      )}

      {filteredSets.length === 0 && (
        <Stack sx={{ py: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary" variant="h6">
            No results
          </Typography>
          <Typography color="textDisabled" variant="body2">
            Try adjusting your filters
          </Typography>
        </Stack>
      )}

      {/* Rendered OUTSIDE a CardGrid for the same reason as the two compact
          grids below: it positions its own rows absolutely and would fight
          CardGrid's CSS grid. It carries its own inline-size container and row
          template. */}
      {filteredSets.length > 0 && density === 'standard' && (
        <VirtualSetGrid
          isFiltering={isFiltering}
          isLoggedIn={isLoggedIn}
          isMissingFilter={selectedObtainedFilter === 'missing'}
          items={setGridItems}
        />
      )}

      {/* Rendered OUTSIDE a CardGrid for the same reason as VirtualVariantGrid
          below: it positions its own rows absolutely and would fight CardGrid's
          CSS grid. It carries its own inline-size container and row template. */}
      {filteredSets.length > 0 && density === 'compact' && groupBySet && (
        <VirtualGroupedGrid isFiltering={isFiltering} isLoggedIn={isLoggedIn} sets={filteredSets} />
      )}

      {/* Rendered OUTSIDE a CardGrid on purpose: VirtualVariantGrid positions its
          own rows absolutely and would fight CardGrid's CSS grid. It carries its
          own inline-size container and row template instead. */}
      {filteredSets.length > 0 && density === 'compact' && !groupBySet && (
        <VirtualVariantGrid
          isFiltering={isFiltering}
          isLoggedIn={isLoggedIn}
          isMissingFilter={selectedObtainedFilter === 'missing'}
          variants={flatVariants}
        />
      )}
    </>
  )
}
