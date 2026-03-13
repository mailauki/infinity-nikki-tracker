'use client'
import { Category, EurekaVariant } from '@/lib/types/eureka'
import { useState } from 'react'
import EurekaButton from './eureka-button'
import GridContainer from '../grid-container'
import { Card, CardActionArea, Grid } from '@mui/material'
import { CategoryItem } from './category-item'
import { CategoryFilter } from '@/lib/types/props'

export default function EurekaFilter({
  eurekaVariants,
  categories,
  isLoggedIn,
}: {
  eurekaVariants: EurekaVariant[]
  categories: Category[]
  isLoggedIn: boolean
}) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('')

  const filteredEureka = eurekaVariants.filter(
    (item) =>
      (selectedCategory === '' || item.category === selectedCategory) && item.obtained === false
  )

  return (
    <>
      <GridContainer
        mainContent={
          <Grid container spacing={2}>
            {filteredEureka.map((eurekaVariant) => (
              <Grid key={eurekaVariant.id} size={{ xs: 6, md: 4 }}>
                <EurekaButton eurekaVariant={eurekaVariant} isLoggedIn={isLoggedIn} />
              </Grid>
            ))}
          </Grid>
        }
        sideContent={
          <>
            {categories.map((category: Category) => (
              <Card
                key={category.slug}
                elevation={0}
                sx={{ backgroundColor: 'transparent', flex: 1 }}
              >
                <CardActionArea
                  data-active={
                    selectedCategory === (category.slug as CategoryFilter) ? '' : undefined
                  }
                  sx={{
                    height: '100%',
                    '&[data-active]': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.selectedHover',
                      },
                    },
                  }}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === (category.slug as CategoryFilter)
                        ? ''
                        : (category.slug as CategoryFilter)
                    )
                  }
                >
                  <CategoryItem eurekaVariants={eurekaVariants} item={category} />
                </CardActionArea>
              </Card>
            ))}
          </>
        }
      />
    </>
  )
}
