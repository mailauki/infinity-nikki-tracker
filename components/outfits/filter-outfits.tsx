'use client'
import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'

import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import OutfitVariantCard from './outfit-variant-card'
import OutfitEvolutionSetCard from './outfit-evolution-set-card'
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
    showByEvolution,
    hideEvolutions,
    filters,
    onToggleObtained,
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

  const filteredSets = outfitSets
    .filter((set) => !selectedOutfitSet || set.slug === selectedOutfitSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      if (showByEvolution) {
        return set
      }
      const filteredVariants = set.outfit_variants
        .filter((v) => !hideEvolutions || v.evolution === null)
        .filter(
          (v) =>
            selectedOutfitCategory.length === 0 ||
            (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
        )
        .filter((v) => !selectedEvolution || v.evolution === selectedEvolution)
        .filter((v) => {
          if (selectedObtainedFilter === 'obtained') return v.obtained === true
          if (selectedObtainedFilter === 'missing') return v.obtained !== true
          return true
        })
      return { ...set, outfit_variants: filteredVariants }
    })
    .filter((set) => (showByEvolution ? set.evolutions.length > 0 : set.outfit_variants.length > 0))
    .sort((a, b) => (sortOrder === 'new' ? b.id! - a.id! : a.id! - b.id!))

  function renderSetVariants(set: (typeof filteredSets)[number]) {
    if (showByEvolution) {
      return [null, ...set.evolutions].map((evolution) => (
        <OutfitEvolutionSetCard
          key={evolution?.slug ?? 'base'}
          evolution={evolution}
          isLoggedIn={isLoggedIn}
          outfitSet={set}
        />
      ))
    }
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
          {filteredSets.flatMap((set) =>
            // Render the base set plus each evolution as its own card.
            [null, ...set.evolutions].map((evolution) => {
              const evolutionKey = evolution?.slug ?? null
              const variants = set.outfit_variants.filter((v) =>
                evolutionKey === null ? v.evolution === null : v.evolution === evolutionKey
              )
              if (variants.length === 0) return null
              const allObtained = variants.every((v) => v.obtained === true)
              return (
                <OutfitSetCard
                  key={`${set.id}-${evolutionKey ?? 'base'}`}
                  evolution={evolution}
                  isLoggedIn={isLoggedIn}
                  obtained={allObtained}
                  set={set}
                  onToggle={() => {
                    // Mark every variant in this group to the opposite of its
                    // current completion state. onToggleObtained flips a single
                    // variant, so only toggle the ones that need to change.
                    variants.forEach((v) => {
                      if (v.obtained === allObtained) {
                        onToggleObtained(v.outfit_set!, v.outfit_category!, v.evolution ?? null)
                      }
                    })
                  }}
                />
              )
            })
          )}
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
