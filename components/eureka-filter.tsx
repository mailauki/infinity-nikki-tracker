'use client'
import { Category, Eureka } from '@/lib/types/types'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEffect, useState } from 'react'
import EurekaButton from './eureka-button'
import ProgressCard from './progress-card'
import GridContainer from './grid-container'
import ProgressList from './progress-list'
import { Grid } from '@mui/material'

type CategoryFilter = '' | 'Head' | 'Hands' | 'Feet'
type EurekaFilter = 'Sets' | 'Eureka' | 'Missing'

export default function EurekaFilter({
  eureka,
  categories,
  isLoggedIn,
}: {
  eureka: Eureka[]
  categories: Category[]
  isLoggedIn: boolean
}) {
  const [category, setCategory] = useState<CategoryFilter>('')
  const [filteredEureka, setFilteredEureka] = useState<Eureka[]>(eureka)

  // const iridescent = colors.find(item => item.name === "Iridescent")
  // const sortedColors = colors.filter(item => item !== iridescent).concat(iridescent!)

  useEffect(() => {
    const filterCategory = eureka.filter((item) => item.category === category)
    const filterMissing = eureka.filter((item) => item.obtained === false)
    const filterMissingCategory = filterCategory.filter((item) => item.obtained === false)

    if (category === '') setFilteredEureka(filterMissing)
    else setFilteredEureka(filterMissingCategory)
  }, [category, eureka])

  return (
    <>
      <div>
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value: CategoryFilter) => setCategory(value)}
        >
          <Grid container spacing={2} sx={{ width: '100%', pb: 2 }}>
            {categories.map((category) => (
              <Grid key={category.name} size={4}>
                <ToggleGroupItem value={category.name} className="h-fit w-full p-0">
                  <ProgressCard item={category} eureka={eureka} isLoggedIn={isLoggedIn} />
                </ToggleGroupItem>
              </Grid>
            ))}
          </Grid>
        </ToggleGroup>
      </div>

      <GridContainer
        mainContent={
          <Grid container spacing={2}>
            {filteredEureka.map((eureka) => (
              <Grid key={eureka.id} size={{ xs: 6, md: 4 }}>
                <EurekaButton eureka={eureka} isLoggedIn={isLoggedIn} />
              </Grid>
            ))}
          </Grid>
        }
        sideContent={<ProgressList items={categories} eureka={eureka} filter="categories" />}
      />
    </>
  )
}
