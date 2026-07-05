'use client'
import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'

import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import CardGrid from '@/components/card-grid'
import { isEvolutionVisible, isGlowup, matchesObtainedFilter } from '@/hooks/outfit'
import OutfitVariantCard from './outfit-variant-card'
import OutfitSetCard from './outfit-set-card'
import OutfitSetSection from './outfit-set-section'

const STANDALONE_SLUG = 'standalone-pieces'

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

export default function FilterOutfits() {
  const {
    outfitSets,
    isLoggedIn,
    isLoading,
    isError,
    isObtainedError,
    groupBySet,
    hideEvolutions,
    hideGlowups,
    filters,
    onBatchToggleObtained,
  } = useOutfitData()
  const { density } = useOutfitImageMode()
  const { sortAxis, sortDir } = useSortOrder()
  // Progress sorting needs obtained data; fall back to date when logged out.
  const axis = !isLoggedIn && sortAxis === 'progress' ? 'date' : sortAxis

  const {
    selectedOutfitSet,
    selectedOutfitCategory,
    selectedEvolution,
    selectedObtainedFilter,
    selectedRarity,
  } = filters

  if (isError) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <ErrorAlert message="Failed to load Outfits data. Please refresh the page." />
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

  // When grouped, each set renders as one card/header per evolution group (base
  // plus each evolution), so the obtained filter is applied at the GROUP level:
  // 'obtained' = every variant in the group obtained, 'missing' = any group that
  // is not fully complete (none or only some obtained). Variants are kept intact
  // so each group shows true progress. When not grouped, the flat views render
  // one card per variant, so the filter is applied per variant.
  const groupLevelObtained = groupBySet

  const filteredSets = outfitSets
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
    .map((set) => {
      const baseSlug = set.slug
      // Map each state slug to its display order for the selectedEvolution filter.
      const orderByStateSlug = new Map<string, number>([
        [baseSlug, 1],
        ...set.evolutions.map((e) => [e.slug, e.order] as [string, number]),
      ])
      // Variants in scope for this set after the structural filters (evolution
      // visibility + evolution order). The group-level obtained state is judged
      // over these — the FULL group — so it reflects true set progress rather
      // than the category-filtered subset.
      const scopedVariants = set.outfit_variants
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
      // Group-level obtained filter: drop whole evolution groups whose full-group
      // state doesn't match the selected missing / obtained state.
      const inMatchingGroup =
        groupLevelObtained && selectedObtainedFilter
          ? scopedVariants.filter((v) => {
              const group = scopedVariants.filter((g) => g.outfit_set === v.outfit_set)
              return matchesObtainedFilter(group, selectedObtainedFilter)
            })
          : scopedVariants
      // Apply the category filter last so it only narrows what is displayed,
      // without affecting the group-level obtained classification above. In
      // ungrouped mode the obtained filter is still per variant.
      const culledVariants = inMatchingGroup
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
      return { ...set, outfit_variants: culledVariants }
    })
    .filter((set) => set.outfit_variants.length > 0)
    .sort((a, b) => {
      // Standalone Pieces is a catch-all bucket — always render it dead last,
      // regardless of sort axis or direction. Only one standalone set exists,
      // so both-standalone never happens.
      if (a.slug === STANDALONE_SLUG) return 1
      if (b.slug === STANDALONE_SLUG) return -1
      const progress = (s: (typeof filteredSets)[number]) => {
        const total = s.outfit_variants.length
        return total === 0 ? 0 : s.outfit_variants.filter((v) => v.obtained).length / total
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

  function renderSetVariants(set: (typeof filteredSets)[number]) {
    return set.outfit_variants.map((variant) => (
      <OutfitVariantCard
        key={variant.id}
        isLoggedIn={isLoggedIn}
        isMissingFilter={selectedObtainedFilter === 'missing'}
        outfitVariant={variant}
      />
    ))
  }

  return (
    <>
      {!isLoggedIn && (
        <Box sx={{ width: 'fit-content', my: 2 }}>
          <LoginAlert title="Outfits" />
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

      {filteredSets.length > 0 && density === 'standard' && (
        <CardGrid columns="outfit" gap={2}>
          {filteredSets.flatMap((set) => {
            const baseSlug = set.slug
            // Render the base set plus each evolution as its own card.
            return [null, ...set.evolutions].map((evolution) => {
              const stateSlug = evolution?.slug ?? baseSlug
              const variants = set.outfit_variants.filter((v) => v.outfit_set === stateSlug)
              if (variants.length === 0) return null
              const allObtained = variants.every((v) => v.obtained === true)
              const obtained = variants.filter((v) => v.obtained === true).length
              return (
                <OutfitSetCard
                  key={`${set.id}-${stateSlug}`}
                  evolution={evolution}
                  isLoggedIn={isLoggedIn}
                  isMissingFilter={selectedObtainedFilter === 'missing'}
                  obtained={obtained}
                  set={set}
                  shouldHide={
                    !isEvolutionVisible({
                      stateSlug,
                      baseSlug,
                      isGlowupState: !!evolution && isGlowup(evolution),
                      hideEvolutions,
                      hideGlowups,
                    })
                  }
                  total={variants.length}
                  onToggle={() => {
                    const toToggle = variants
                      .filter((v) => v.obtained === allObtained)
                      .map((v) => ({
                        outfit_set: v.outfit_set!,
                        outfit_category: v.outfit_category!,
                        outfit_variant: v.slug,
                      }))
                    onBatchToggleObtained(toToggle, !allObtained)
                  }}
                />
              )
            })
          })}
        </CardGrid>
      )}

      {filteredSets.length > 0 && density === 'compact' && (
        <CardGrid columns="outfit" gap={2}>
          {groupBySet ? (
            <>
              {filteredSets.map((set) => (
                <OutfitSetSection key={set.id} isLoggedIn={isLoggedIn} set={set} />
              ))}
            </>
          ) : (
            <>{filteredSets.flatMap((set) => renderSetVariants(set))}</>
          )}
        </CardGrid>
      )}
    </>
  )
}
