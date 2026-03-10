'use client'
import React from 'react'
import { Category, EurekaSet } from '@/lib/types/eureka'
import FilterToolbar from './filter-toolbar'
import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import EurekaColorSetCard from './eureka/eureka-color-set-card'
import { CategoryFilter, ToggleFilter } from '@/lib/types/props'
import { useState } from 'react'
import { SelectChangeEvent } from '@mui/material'
import EurekaVariantCard from './eureka/eureka-variant-card'
import ProgressChip from './progress-chip'
import { countObtained, percent } from '@/hooks/count-obtained'
import LoginAlert from './login-alert'

export default function FilterEureka({
  eurekaSets,
  categories,
  isLoggedIn,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  isLoggedIn: boolean
}) {
  const [selectedEurekaSet, setSelectedEurekaSet] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<ToggleFilter | null>(null)
  const [groupBySet, setGroupBySet] = useState(true)
  const [showByColor, setShowByColor] = useState(false)

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    setSelectedEurekaSet(event.target.value || null)
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    setSelectedCategory(newCategory)
  }

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ToggleFilter | null
  ) => {
    setSelectedFilter(newFilter)
  }

  const handleGroupBySetChange = () => {
    setGroupBySet((prev) => !prev)
  }

  const handleShowByColorChange = () => {
    setShowByColor((prev) => {
      if (!prev) {
        setSelectedCategory(null)
        setSelectedFilter(null)
      }
      return !prev
    })
  }

  const handleClearFilters = () => {
    setSelectedEurekaSet(null)
    setSelectedCategory(null)
    setSelectedFilter(null)
    setShowByColor(false)
  }

  const filteredSets = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .map((set) => {
      if (showByColor) {
        return { ...set, eureka_variants: set.eureka_variants, colors: set.colors }
      }

      const filteredVariants = set.eureka_variants
        .filter((v) => !selectedCategory || v.category === selectedCategory)
        .filter((v) => {
          if (selectedFilter === 'Obtained') return v.obtained === true
          if (selectedFilter === 'Missing') return v.obtained !== true
          return true
        })

      return { ...set, eureka_variants: filteredVariants, colors: set.colors }
    })
    .filter((set) => (showByColor ? set.colors.length > 0 : set.eureka_variants.length > 0))

  const resultsCount = showByColor
    ? filteredSets.length
    : filteredSets.flatMap((set) => set.eureka_variants).length || 0

  return (
    <>
      <FilterToolbar
        eurekaSets={eurekaSets}
        categories={categories}
        selectedEurekaSet={selectedEurekaSet}
        selectedCategory={selectedCategory}
        selectedFilter={selectedFilter}
        groupBySet={groupBySet}
        onEurekaSetChange={handleEurekaSetChange}
        onCategoryChange={handleCategoryChange}
        onFilterChange={handleFilterChange}
        showByColor={showByColor}
        onGroupBySetChange={handleGroupBySetChange}
        onShowByColorChange={handleShowByColorChange}
        onClearFilters={handleClearFilters}
        resultsCount={resultsCount}
        isLoggedIn={isLoggedIn}
      />

      <Container maxWidth="md">
        {!isLoggedIn && <LoginAlert />}

        {filteredSets.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <Typography variant="h6" color="textSecondary">
              No results
            </Typography>
            <Typography variant="body2" color="textDisabled">
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
              gap: 1,
              py: groupBySet ? 0 : 2,
              mb: 4,
            }}
          >
            {filteredSets.map((set) => (
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
                      direction="row"
                      alignItems="flex-end"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="overline">{set.title}</Typography>
                      {isLoggedIn && (
                        <ProgressChip
                          percentage={percent(
                            countObtained(set.eureka_variants).obtained,
                            countObtained(set.eureka_variants).total
                          )}
                          size="lg"
                        />
                      )}
                    </Stack>
                    <Divider />
                  </Box>
                )}
                {showByColor
                  ? set.colors.map((color) => (
                        <EurekaColorSetCard key={`${set.slug}-${color.title}`} eurekaSet={set} color={color} isLoggedIn={isLoggedIn} />
                    ))
                  : set.eureka_variants.map((variant) => (
                      <EurekaVariantCard
                        key={variant.id}
                        eurekaVariant={variant}
                        isLoggedIn={isLoggedIn}
                      />
                    ))}
              </React.Fragment>
            ))}
          </Box>
        )}
      </Container>
    </>
  )
}
