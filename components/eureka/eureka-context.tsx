'use client'

import { createContext, useContext } from 'react'

import { EurekaCategory, EurekaColor, EurekaSet, ObtainedEureka, Trial } from '@/lib/types/eureka'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'

interface FilterState {
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedObtainedFilter: ObtainedFilter | null
  selectedColor: string | null
  selectedRarity: number | null
}

interface EurekaDataContextValue {
  eurekaSets: EurekaSet[]
  obtainedKeys: Set<string>
  obtainedEureka: ObtainedEureka[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
  trials: Trial[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  userId: string | null
  groupBySet: boolean
  showByColor: boolean
  onGroupBySetChange: () => void
  onShowByColorChange: () => void
  filters: FilterState
  onFiltersChange: (updates: Partial<FilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (eureka_set: string, category: string, color: string) => void
  onBatchToggleObtained: (
    variants: Array<{ eureka_set: string; category: string; color: string }>,
    targetObtained: boolean
  ) => void
}

const DEFAULT_FILTERS: FilterState = {
  selectedEurekaSet: null,
  selectedCategory: null,
  selectedObtainedFilter: null,
  selectedColor: null,
  selectedRarity: null,
}

export const EurekaDataContext = createContext<EurekaDataContextValue>({
  eurekaSets: [],
  obtainedKeys: new Set(),
  obtainedEureka: [],
  categories: [],
  colors: [],
  trials: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  userId: null,
  groupBySet: true,
  showByColor: false,
  onGroupBySetChange: () => {},
  onShowByColorChange: () => {},
  filters: DEFAULT_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
  onBatchToggleObtained: () => {},
})

export { DEFAULT_FILTERS }
export type { FilterState }

export function useEurekaData() {
  return useContext(EurekaDataContext)
}
