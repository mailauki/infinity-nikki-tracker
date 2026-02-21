'use client'
import { Category, Eureka } from '@/lib/types/types'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEffect, useState } from 'react'
import EurekaButton from './eureka-button'
import ProgressCard from './progress-card'

type CategoryFilter = '' | 'Head' | 'Hands' | 'Feet'
type EurekaFilter = 'Sets' | 'Eureka' | 'Missing'

export default function EurekaFilter({
  eureka,
  categories,
	user
}: {
  eureka: Eureka[]
  categories: Category[]
	user: boolean
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

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
                <ProgressCard key={category.name} item={category} eureka={eureka} />
              </ToggleGroupItem>
            ))}
          </div>
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-2 grid-rows-5 gap-4 md:grid-cols-3">
        {filteredEureka.map((eureka) => (
          <EurekaButton key={eureka.id} eureka={eureka} user={user} />
        ))}
      </div>
    </>
  )
}
