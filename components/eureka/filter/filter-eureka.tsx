'use client'
import React from 'react'
import { Category, Color, EurekaSet } from '@/lib/types/eureka'
import FilterToolbar from './filter-toolbar'
import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material'
import EurekaColorSetCard from '../eureka-color-set-card'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import { useState } from 'react'
import { SelectChangeEvent } from '@mui/material'
import EurekaVariantCard from '../eureka-variant-card'
import ProgressChip from '../../progress-chip'
import { countObtained, percent } from '@/hooks/count-obtained'
import LoginAlert from '../../login-alert'
import { ChevronRight } from '@mui/icons-material'

export default function FilterEureka({
  eurekaSets,
  categories,
  colors,
  isLoggedIn,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  isLoggedIn: boolean
}) {
  const [selectedEurekaSet, setSelectedEurekaSet] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null)
  const [selectedObtainedFilter, setSelectedObtainedFilter] = useState<ObtainedFilter | null>(null)
  const [groupBySet, setGroupBySet] = useState(true)
  const [showByColor, setShowByColor] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    setSelectedEurekaSet(event.target.value || null)
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    setSelectedCategory(newCategory)
  }

  const handleObtainedFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => {
    setSelectedObtainedFilter(newFilter)
  }

  const handleGroupBySetChange = () => {
    setGroupBySet((prev) => !prev)
  }

  const handleShowByColorChange = () => {
    setShowByColor((prev) => {
      if (!prev) {
        setSelectedCategory(null)
        setSelectedObtainedFilter(null)
        setSelectedColor(null)
        setGroupBySet(groupBySet)
      }
      return !prev
    })
  }

  const handleColorChange = (event: SelectChangeEvent) => {
    setSelectedColor(event.target.value || null)
  }

  const handleClearFilters = () => {
    setSelectedEurekaSet(null)
    setSelectedCategory(null)
    setSelectedObtainedFilter(null)
    setSelectedColor(null)
    setShowByColor(false)
    setGroupBySet(groupBySet)
  }

  const filteredSets = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .map((set) => {
      const filteredColors = set.colors.filter((c) => !selectedColor || c.slug === selectedColor)

      if (showByColor) {
        return { ...set, eureka_variants: set.eureka_variants, colors: filteredColors }
      }

      const filteredVariants = set.eureka_variants
        .filter((v) => !selectedColor || v.color === selectedColor)
        .filter((v) => !selectedCategory || v.category === selectedCategory)
        .filter((v) => {
          if (selectedObtainedFilter === 'Obtained') return v.obtained === true
          if (selectedObtainedFilter === 'Missing') return v.obtained !== true
          return true
        })

      return { ...set, eureka_variants: filteredVariants, colors: filteredColors }
    })
    .filter((set) => (showByColor ? set.colors.length > 0 : set.eureka_variants.length > 0))

  const resultsCount = showByColor
    ? filteredSets.flatMap((set) => set.colors).length
    : filteredSets.flatMap((set) => set.eureka_variants).length || 0

  return (
    <>
      <FilterToolbar
        categories={categories}
        colors={colors}
        eurekaSets={eurekaSets}
        groupBySet={groupBySet}
        isLoggedIn={isLoggedIn}
        resultsCount={resultsCount}
        selectedCategory={selectedCategory}
        selectedColor={selectedColor}
        selectedEurekaSet={selectedEurekaSet}
        selectedObtainedFilter={selectedObtainedFilter}
        showByColor={showByColor}
        onCategoryChange={handleCategoryChange}
        onClearFilters={handleClearFilters}
        onColorChange={handleColorChange}
        onEurekaSetChange={handleEurekaSetChange}
        onGroupBySetChange={handleGroupBySetChange}
        onObtainedFilterChange={handleObtainedFilterChange}
        onShowByColorChange={handleShowByColorChange}
      />

      <Container maxWidth="md">
        {!isLoggedIn && <LoginAlert />}

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
    </>
  )
}
