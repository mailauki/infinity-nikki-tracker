'use client'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'

import { useEurekaData } from '../eureka-context'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import EurekaColorSetCard from '../eureka-color-set-card'
import EurekaVariantCard from '../eureka-variant-card'
import ProgressChip from '../../progress-chip'
import LoginAlert from '../../login-alert'
import { countObtained, percent } from '@/hooks/count-obtained'

export default function FilterEureka() {
  const { eurekaSets, isLoggedIn } = useEurekaData()

  const searchParams = useSearchParams()

  const selectedEurekaSet = searchParams.get('set')
  const selectedCategory = searchParams.get('category') as CategoryFilter | null
  const selectedObtainedFilter = searchParams.get('filter') as ObtainedFilter | null
  const groupBySet = searchParams.get('groupBySet') !== 'false'
  const showByColor = searchParams.get('showByColor') === 'true'
  const selectedColor = searchParams.get('color')

  const filteredSets = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .map((set) => {
      const filteredColors = set.colors.filter((color) => !selectedColor || color.slug === selectedColor)

      if (showByColor) {
        return { ...set, eureka_variants: set.eureka_variants, colors: filteredColors }
      }

      const filteredVariants = set.eureka_variants
        .filter((variant) => !selectedColor || variant.color === selectedColor)
        .filter((variant) => !selectedCategory || variant.category === selectedCategory)
        .filter((variant) => {
          if (selectedObtainedFilter === 'Obtained') return variant.obtained === true
          if (selectedObtainedFilter === 'Missing') return variant.obtained !== true
          return true
        })

      return { ...set, eureka_variants: filteredVariants, colors: filteredColors }
    })
    .filter((set) => (showByColor ? set.colors.length > 0 : set.eureka_variants.length > 0))

  const resultsCount = showByColor
    ? filteredSets.flatMap((set) => set.colors).length
    : filteredSets.flatMap((set) => set.eureka_variants).length || 0

  return (
    <Container maxWidth="md">
      {!isLoggedIn && <LoginAlert />}

      <Typography color="textSecondary" sx={{ pt: 2, pb: 0.5, px: 0.5 }} variant="caption">
        Showing: {resultsCount} results
      </Typography>

      {filteredSets.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
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
            gridTemplateColumns: {
              xs: '1fr 1fr 1fr',
              sm: '1fr 1fr 1fr 1fr',
              md: '1fr 1fr 1fr 1fr 1fr',
            },
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: groupBySet ? 0 : 2,
            mb: 4,
          }}
        >
          {filteredSets.map((set) => {
            const { obtained, total } = countObtained(set.eureka_variants)
            return (
              <React.Fragment key={set.slug}>
                {groupBySet && (
                  <Box
                    key={`${set.slug}-header`}
                    sx={{
                      gridColumn: { xs: '1/4', sm: '1/5', md: '1/6' },
                      mt: 2,
                    }}
                  >
                    <Stack
                      alignItems="flex-end"
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
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
                        <ProgressChip percentage={percent(obtained, total)} size="lg" />
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
                      />
                    ))}
              </React.Fragment>
            )
          })}
        </Box>
      )}
    </Container>
  )
}
