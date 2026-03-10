'use client'
import { Category, EurekaSet } from '@/lib/types/eureka'
import FilterToolbar from './filter-toolbar'
import { Box, Card, Divider, Stack, Typography } from '@mui/material'
import EurekaColorSetCard from './eureka/eureka-color-set-card'
import { CategoryFilter } from '@/lib/types/props'
import { useState } from 'react'
import { SelectChangeEvent } from '@mui/material'

export default function FilterEureka({
  eurekaSets,
  categories,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
}) {
  const [selectedEurekaSet, setSelectedEurekaSet] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null)

  const handleEurekaSetChange = (event: SelectChangeEvent) => {
    setSelectedEurekaSet(event.target.value || null)
  }

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => {
    setSelectedCategory(newCategory)
  }

  const filteredSets = eurekaSets
    .filter((set) => !selectedEurekaSet || set.slug === selectedEurekaSet)
    .map((set) => ({
      ...set,
      colors: selectedCategory
        ? set.colors.filter((color) =>
            set.eureka_variants.some(
              (v) => v.color === color.title && v.category === selectedCategory
            )
          )
        : set.colors,
    }))
    .filter((set) => set.colors.length > 0)

  return (
    <>
      <FilterToolbar
        eurekaSets={eurekaSets}
        categories={categories}
        selectedEurekaSet={selectedEurekaSet}
        selectedCategory={selectedCategory}
        onEurekaSetChange={handleEurekaSetChange}
        onCategoryChange={handleCategoryChange}
      />
      <Stack spacing={1}>
        {filteredSets.map((set) => (
          <Box
            key={set.slug}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr 1fr',
                sm: '1fr 1fr 1fr',
                md: '1fr 1fr 1fr 1fr 1fr',
              },
              gap: 1,
            }}
          >
            <Box sx={{ gridColumn: { xs: '1/3', sm: '1/4', md: '1/6' } }}>
              <Typography variant="overline">{set.title}</Typography>
              <Divider />
            </Box>
            {set.colors.map((color) => (
              <Card key={`${set.slug}-${color.title}`} sx={{ minWidth: 'fit-content' }}>
                <EurekaColorSetCard eurekaSet={set} color={color} />
              </Card>
            ))}
          </Box>
        ))}
      </Stack>
    </>
  )
}
