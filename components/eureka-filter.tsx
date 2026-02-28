'use client'
import { Category, Eureka } from '@/lib/types/types'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEffect, useState } from 'react'
import EurekaButton from './eureka-button'
import ProgressCard from './progress-card'
import GridContainer from './grid-container'
import ProgressList from './progress-list'

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
          <div className="grid w-full grid-cols-3 gap-4 pb-4">
            {categories.map((category) => (
              <ToggleGroupItem key={category.name} value={category.name} className="h-fit p-0">
                <ProgressCard key={category.name} item={category} eureka={eureka} isLoggedIn={isLoggedIn} />
              </ToggleGroupItem>
            ))}
          </div>
        </ToggleGroup>
      </div>

      <GridContainer
        mainContent={
          <div className="grid grid-cols-2 grid-rows-5 gap-4 md:grid-cols-3">
            {filteredEureka.map((eureka) => (
              <EurekaButton key={eureka.id} eureka={eureka} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        }
        sideContent={<ProgressList items={categories} eureka={eureka} filter="categories" />}
      />
    </>
  )
}
