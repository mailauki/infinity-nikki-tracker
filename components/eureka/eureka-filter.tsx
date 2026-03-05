'use client'
import { Category, EurekaVariant } from '@/lib/types/eureka'
import { useState } from 'react'
import EurekaButton from './eureka-button'
import GridContainer from '../grid-container'
import { Card, CardActionArea, Grid, List } from '@mui/material'
import { CategoryItem } from '../category-item'

type CategoryFilter = '' | 'Head' | 'Hands' | 'Feet'
type EurekaFilter = 'Sets' | 'Eureka' | 'Missing'

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
          <List sx={{ width: '100%' }}>
            {categories.map((category: Category) => (
              <Card key={category.name} elevation={0} component="li">
                <CardActionArea
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === (category.name as CategoryFilter)
                        ? ''
                        : (category.name as CategoryFilter)
                    )
                  }
                  data-active={
                    selectedCategory === (category.name as CategoryFilter) ? '' : undefined
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
                >
                  <CategoryItem item={category} eurekaVariants={eurekaVariants} />
                </CardActionArea>
              </Card>
            ))}
          </List>
        }
      />
    </>
  )
}
