'use client'
import React from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { ChevronRight, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'

import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import EurekaColorSetCard from '@/components/eureka/eureka-color-set-card'
import EurekaVariantCard from '@/components/eureka/eureka-variant-card'
import ProgressChip from '@/components/progress-chip'
import LoginAlert from '@/components/login-alert'
import { countObtained, percent } from '@/hooks/count-obtained'

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

export default function FilterEureka() {
  const {
    eurekaSets,
    isLoggedIn,
    isLoading,
    isError,
    isObtainedError,
    groupBySet,
    showByColor,
    filters,
    onBatchToggleObtained,
  } = useEurekaData()
  const { sortOrder } = useSortOrder()

  const {
    selectedEurekaSet,
    selectedCategory,
    selectedObtainedFilter,
    selectedColor,
    selectedRarity,
  } = filters

  if (isError) {
    return (
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <ErrorAlert message="Failed to load Eureka data. Please refresh the page." />
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

  const filteredSets = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
    .map((set) => {
      const filteredColors = set.colors.filter(
        (color) => !selectedColor || color.slug === selectedColor
      )
      if (showByColor) {
        return { ...set, colors: filteredColors }
      }

      const filteredVariants = set.eureka_variants
        .filter((variant) => !selectedColor || variant.color === selectedColor)
        .filter((variant) => !selectedCategory || variant.category === selectedCategory)
        .filter((variant) => {
          if (selectedObtainedFilter === 'obtained') return variant.obtained === true
          if (selectedObtainedFilter === 'missing') return variant.obtained !== true
          return true
        })

      return { ...set, eureka_variants: filteredVariants, colors: filteredColors }
    })
    .filter((set) => (showByColor ? set.colors.length > 0 : set.eureka_variants.length > 0))
    .sort((a, b) => (sortOrder === 'new' ? b.id! - a.id! : a.id! - b.id!))

  return (
    <>
      {!isLoggedIn && (
        <Box sx={{ width: 'fit-content', my: 2 }}>
          <LoginAlert title="Eureka" />
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
            // `set.eureka_variants` is already filtered, so read the full set from
            // context for the true count and the batch-toggle target.
            const fullSet = eurekaSets.find((s) => s.id === set.id) ?? set
            const groupVariants = fullSet.eureka_variants
            const { obtained, total } = countObtained(groupVariants)
            const allObtained = total > 0 && obtained === total

            // Batch-toggle the whole set: when fully obtained, clear it; otherwise
            // mark the remaining (not-yet-obtained) variants obtained.
            const handleToggle = () => {
              const toToggle = groupVariants
                .filter((v) => !!v.obtained === allObtained)
                .map((v) => ({
                  eureka_set: v.eureka_set!,
                  category: v.category!,
                  color: v.color!,
                }))
              onBatchToggleObtained(toToggle, !allObtained)
            }
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
                        href={`/eureka/${set.slug}`}
                        size="small"
                      >
                        {set.title}
                      </Button>

                      {isLoggedIn && (
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Chip label={`${obtained} / ${total}`} size="small" variant="outlined" />
                          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                            <ProgressChip percentage={percent(obtained, total)} size="lg" />
                          </Box>
                          <IconButton
                            aria-label={allObtained ? 'Mark as not obtained' : 'Mark as obtained'}
                            size="small"
                            onClick={handleToggle}
                          >
                            {allObtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>
                    <Divider />
                  </Box>
                )}
                {showByColor
                  ? set.colors.map((color) => (
                      <EurekaColorSetCard
                        key={`${set.slug}-${color.slug}`}
                        color={color}
                        eurekaSet={set}
                        isLoggedIn={isLoggedIn}
                      />
                    ))
                  : set.eureka_variants.map((variant) => (
                      <EurekaVariantCard
                        key={variant.id}
                        eurekaVariant={variant}
                        isLoggedIn={isLoggedIn}
                        isMissingFilter={selectedObtainedFilter === 'missing'}
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
