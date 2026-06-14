'use client'
import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'

import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import { isEvolutionVisible, matchesObtainedFilter } from '@/hooks/outfit'
import OutfitVariantCard from './outfit-variant-card'
import OutfitSetCard from './outfit-set-card'
import OutfitSetSection from './outfit-set-section'

// Shared responsive column track for both density grids.
const OUTFIT_GRID_COLUMNS = {
  xs: 'repeat(2, 1fr)',
  sm: 'repeat(3, 1fr)',
  md: 'repeat(4, 1fr)',
  lg: 'repeat(6, 1fr)',
  xl: 'repeat(8, 1fr)',
}

function GroupHeaderSkeleton() {
  return (
    <Box sx={{ gridColumn: { xs: '1/4', sm: '1/5', md: '1/6' } }}>
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
  const { sortOrder } = useSortOrder()

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
        <Skeleton height={20} sx={{ mt: 2, mb: 0.5 }} variant="text" width={100} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            gap: { xs: 1, sm: 1.5, md: 2 },
          }}
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
        </Box>
      </Box>
    )
  }

  // When grouped, each set renders as one card/header per evolution group (base
  // plus each evolution), so the obtained filter is applied at the GROUP level:
  // 'missing' = no variant in the group obtained, 'in-progress' = some, and
  // 'obtained' = all. Variants are kept intact so each group shows true progress.
  // When not grouped, the flat views render one card per variant, so the filter
  // is applied per variant (missing/obtained only — 'in-progress' is inapplicable
  // and the toggle does not offer it there).
  const groupLevelObtained = groupBySet

  const filteredSets = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      const orderBySlug = new Map(set.evolutions.map((e) => [e.slug, e.order]))
      const baseEvoSlug = `${set.slug}-base`
      const filteredVariants = set.outfit_variants
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
            selectedOutfitCategory.length === 0 ||
            (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
        )
        .filter(
          (v) =>
            !selectedEvolution ||
            (!!v.evolution && orderBySlug.get(v.evolution) === selectedEvolution)
        )
        .filter((v) => {
          // Grouped mode keeps every variant; the filter is applied per group below.
          if (groupLevelObtained) return true
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        })
      // Group-level obtained filter: drop whole evolution groups that don't match
      // the selected missing / in-progress / obtained state.
      const culledVariants =
        groupLevelObtained && selectedObtainedFilter
          ? filteredVariants.filter((v) => {
              const group = filteredVariants.filter((g) => g.evolution === v.evolution)
              return matchesObtainedFilter(group, selectedObtainedFilter)
            })
          : filteredVariants
      return { ...set, outfit_variants: culledVariants }
    })
    .filter((set) => set.outfit_variants.length > 0)
    .sort((a, b) => (sortOrder === 'new' ? b.id! - a.id! : a.id! - b.id!))

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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: OUTFIT_GRID_COLUMNS,
            gap: 2,
          }}
        >
          {filteredSets.flatMap((set) => {
            // Base variants carry the concrete {set}-base slug end-to-end.
            const baseEvoSlug = `${set.slug}-base`
            // Render the base set plus each evolution as its own card.
            return [null, ...set.evolutions].map((evolution) => {
              const evolutionKey = evolution?.slug ?? baseEvoSlug
              const variants = set.outfit_variants.filter((v) => v.evolution === evolutionKey)
              if (variants.length === 0) return null
              const allObtained = variants.every((v) => v.obtained === true)
              return (
                <OutfitSetCard
                  key={`${set.id}-${evolutionKey}`}
                  evolution={evolution}
                  isLoggedIn={isLoggedIn}
                  isMissingFilter={selectedObtainedFilter === 'missing'}
                  obtained={allObtained}
                  set={set}
                  shouldHide={
                    !isEvolutionVisible({
                      evolutionSlug: evolutionKey,
                      baseSlug: baseEvoSlug,
                      glowupSlug: set.glowup_evolution,
                      hideEvolutions,
                      hideGlowups,
                    })
                  }
                  onToggle={() => {
                    const toToggle = variants
                      .filter((v) => v.obtained === allObtained)
                      .map((v) => ({
                        outfit_set: v.outfit_set!,
                        outfit_category: v.outfit_category!,
                        evolution: v.evolution,
                      }))
                    onBatchToggleObtained(toToggle, !allObtained)
                  }}
                />
              )
            })
          })}
        </Box>
      )}

      {filteredSets.length > 0 && density === 'compact' && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: OUTFIT_GRID_COLUMNS,
            gap: 2,
          }}
        >
          {groupBySet
            ? filteredSets.map((set) => (
                <OutfitSetSection key={set.id} isLoggedIn={isLoggedIn} set={set} />
              ))
            : filteredSets.flatMap((set) => renderSetVariants(set))}
        </Box>
      )}
    </>
  )
}
