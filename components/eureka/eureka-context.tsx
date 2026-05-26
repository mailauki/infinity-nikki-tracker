'use client'

import { createContext, useContext } from 'react'

import { Category, Color, EurekaSet, Trial } from '@/lib/types/eureka'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'

interface FilterState {
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedObtainedFilter: ObtainedFilter | null
  selectedColor: string | null
  selectedRarities: number[]
}

interface EurekaDataContextValue {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  trials: Trial[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  userId: string | null
  groupBySet: boolean
  showByColor: boolean
  onGroupBySetChange: () => void
  onShowByColorChange: () => void
  filters: FilterState
  onFiltersChange: (updates: Partial<FilterState>) => void
  onClearFilters: () => void
}

const DEFAULT_FILTERS: FilterState = {
  selectedEurekaSet: null,
  selectedCategory: null,
  selectedObtainedFilter: null,
  selectedColor: null,
  selectedRarities: [],
}

export const EurekaDataContext = createContext<EurekaDataContextValue>({
  eurekaSets: [],
  categories: [],
  colors: [],
  trials: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  userId: null,
  groupBySet: true,
  showByColor: false,
  onGroupBySetChange: () => {},
  onShowByColorChange: () => {},
  filters: DEFAULT_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
})

export { DEFAULT_FILTERS }
export type { FilterState }

export function useEurekaData() {
  return useContext(EurekaDataContext)
}
