'use client'
import { Category, EurekaVariant } from '@/lib/types/types'
import { useEffect, useState } from 'react'
import EurekaButton from './eureka-button'
import GridContainer from '../grid-container'
import ProgressList from '../progress-list'
import { Grid } from '@mui/material'

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
  const [category, setCategory] = useState<CategoryFilter>('')
  const [filteredEureka, setFilteredEureka] = useState<EurekaVariant[]>(eurekaVariants)

  // const iridescent = colors.find(item => item.name === "Iridescent")
  // const sortedColors = colors.filter(item => item !== iridescent).concat(iridescent!)

  useEffect(() => {
    const filterCategory = eurekaVariants.filter((item) => item.category === category)
    const filterMissing = eurekaVariants.filter((item) => item.obtained === false)
    const filterMissingCategory = filterCategory.filter((item) => item.obtained === false)

    if (category === '') setFilteredEureka(filterMissing)
    else setFilteredEureka(filterMissingCategory)
  }, [category, eurekaVariants])

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
          <ProgressList
            items={categories}
            eurekaVariants={eurekaVariants}
            value={category}
            onValueChange={(value) => setCategory(value as CategoryFilter)}
          />
        }
      />
    </>
  )
}
