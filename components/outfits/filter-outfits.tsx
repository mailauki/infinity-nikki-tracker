'use client'
import React from 'react'
import { Alert, Box, Button, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'

import ErrorAlert from '@/components/error-alert'
import LoginAlert from '@/components/login-alert'
import ProgressChip from '@/components/progress-chip'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import { percent } from '@/hooks/count-obtained'
import OutfitVariantCard from './outfit-variant-card'
import OutfitEvolutionSetCard from './outfit-evolution-set-card'

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
    filters,
  } = useOutfitData()
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
        .filter((v) => !selectedOutfitCategory || v.outfit_category === selectedOutfitCategory)
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

  return (
    <>
      {!isLoggedIn && (
        <Box sx={{ width: 'fit-content', my: 2 }}>
          <LoginAlert />
        </Box>
      )}

      {isObtainedError && (
        <Alert severity="warning" sx={{ width: 'fit-content', my: 2 }}>
          Could not load your collection status. Progress may be inaccurate.
        </Alert>
      )}

      {filteredSets.length === 0 ? (
        <Stack sx={{ py: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary" variant="h6">
            No results
          </Typography>
          <Typography color="textDisabled" variant="body2">
            Try adjusting your filters
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: groupBySet ? 0 : 2,
          }}
        >
          {filteredSets.map((set) => {
            const obtained = set.outfit_variants.reduce(
              (sum, v) => sum + (v.obtained ? 1 : 0),
              0
            )
            const total = set.outfit_variants.length
            return (
              <React.Fragment key={set.slug}>
                {groupBySet && (
                  <Box
                    sx={{
                      gridColumn: { xs: '1/4', sm: '1/5', md: '1/6' },
                      mt: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
                    >
                      <Button
                        color="inherit"
                        endIcon={<ChevronRight />}
                        href={`/outfits/${set.slug}`}
                        size="small"
                      >
                        {set.title}
                      </Button>

                      {isLoggedIn && (
                        <ProgressChip percentage={percent(obtained, total)} size="lg" />
                      )}
                    </Stack>
                    <Divider />
                  </Box>
                )}
                {showByEvolution
                  ? [null, ...set.evolutions].map((evolution) => (
                      <OutfitEvolutionSetCard
                        key={evolution?.slug ?? 'base'}
                        evolution={evolution}
                        isLoggedIn={isLoggedIn}
                        outfitSet={set}
                      />
                    ))
                  : set.outfit_variants.map((variant) => (
                      <OutfitVariantCard
                        key={variant.id}
                        isLoggedIn={isLoggedIn}
                        isMissingFilter={selectedObtainedFilter === 'missing'}
                        outfitVariant={variant}
                      />
                    ))}
              </React.Fragment>
            )
          })}
        </Box>
      )}
    </>
  )
}
