'use client'

import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'

import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import { isEvolutionVisible, matchesObtainedFilter } from '@/hooks/outfit'
import { toTitle } from '@/lib/utils'
import { OutfitSet } from '@/lib/types/outfit'
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

// Sets with no season fall into a trailing group under this label.
const UNASSIGNED = 'Unassigned'

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

export default function FilterOutfitsBySeason() {
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
        </Box>
      </Box>
    )
  }

  // Mirrors FilterOutfits: the obtained filter is judged at the GROUP level when
  // grouped, and per variant when flat. See that component for the full rationale.
  const groupLevelObtained = groupBySet

  const filteredSets = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      const orderBySlug = new Map(set.evolutions.map((e) => [e.slug, e.order]))
      const baseEvoSlug = `${set.slug}-base`
      const scopedVariants = set.outfit_variants
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
          ? scopedVariants.filter((v) => {
              const group = scopedVariants.filter((g) => g.evolution === v.evolution)
              return matchesObtainedFilter(group, selectedObtainedFilter)
            })
          : scopedVariants
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
      return { ...set, outfit_variants: culledVariants }
    })
    .filter((set) => set.outfit_variants.length > 0)
    .sort((a, b) => (sortOrder === 'new' ? b.id! - a.id! : a.id! - b.id!))

  // Group the filtered sets by their season slug. Seasoned groups come first in
  // alphabetical order by title; unseasoned sets trail under "Unassigned".
  const groups = new Map<string, typeof filteredSets>()
  for (const set of filteredSets) {
    const key = set.seasons ?? ''
    const bucket = groups.get(key)
    if (bucket) bucket.push(set)
    else groups.set(key, [set])
  }

  const orderedGroups = Array.from(groups.entries())
    .map(([slug, sets]) => ({
      slug,
      label: slug ? toTitle(slug) : UNASSIGNED,
      sets,
    }))
    .sort((a, b) => {
      if (!a.slug) return 1
      if (!b.slug) return -1
      return a.label.localeCompare(b.label)
    })

  function renderSetVariants(set: OutfitSet) {
    return set.outfit_variants.map((variant) => (
      <OutfitVariantCard
        key={variant.id}
        isLoggedIn={isLoggedIn}
        isMissingFilter={selectedObtainedFilter === 'missing'}
        outfitVariant={variant}
      />
    ))
  }

  function renderStandardCards(set: OutfitSet) {
    // Base variants carry the concrete {set}-base slug end-to-end.
    const baseEvoSlug = `${set.slug}-base`
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

      {orderedGroups.map((group) => (
        <Stack key={group.slug || UNASSIGNED} spacing={1.5} sx={{ mb: 4 }}>
          <Box>
            <Stack
              direction="row"
              sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
            >
              <Typography variant="h6">{group.label}</Typography>
              <Typography color="textSecondary" variant="body2">
                {group.sets.length}
              </Typography>
            </Stack>
            <Divider />
          </Box>

          {density === 'standard' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: OUTFIT_GRID_COLUMNS,
                gap: 2,
              }}
            >
              {group.sets.flatMap((set) => renderStandardCards(set))}
            </Box>
          )}

          {density === 'compact' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: OUTFIT_GRID_COLUMNS,
                gap: 2,
              }}
            >
              {groupBySet
                ? group.sets.map((set) => (
                    <OutfitSetSection key={set.id} isLoggedIn={isLoggedIn} set={set} />
                  ))
                : group.sets.flatMap((set) => renderSetVariants(set))}
            </Box>
          )}
        </Stack>
      ))}
    </>
  )
}
