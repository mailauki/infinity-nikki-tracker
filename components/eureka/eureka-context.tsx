'use client'

import { createContext, useContext } from 'react'

import {
  EurekaCategory,
  EurekaColor,
  EurekaSet,
  Label,
  ObtainedEureka,
  Style,
  Trial,
} from '@/lib/types/eureka'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'

interface FilterState {
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedObtainedFilter: ObtainedFilter | null
  selectedColor: string | null
  selectedRarity: number | null
  selectedStyle: string[]
  selectedLabel: string[]
  selectedTrial: string[]
}

interface EurekaDataContextValue {
  eurekaSets: EurekaSet[]
  obtainedKeys: Set<string>
  obtainedEureka: ObtainedEureka[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
  trials: Trial[]
  styles: Style[]
  labels: Label[]
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
  // Variant keys currently animating out under the "missing" filter. The filter
  // pipeline keeps them visible until the animation finishes — see
  // hooks/use-exit-hold.ts.
  exitingKeys: ReadonlySet<string>
  onHoldExit: (keys: string[]) => void
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
  selectedStyle: [],
  selectedLabel: [],
  selectedTrial: [],
}

export const EurekaDataContext = createContext<EurekaDataContextValue>({
  eurekaSets: [],
  obtainedKeys: new Set(),
  obtainedEureka: [],
  categories: [],
  colors: [],
  trials: [],
  styles: [],
  labels: [],
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
  exitingKeys: new Set<string>(),
  onHoldExit: () => {},
  onToggleObtained: () => {},
  onBatchToggleObtained: () => {},
})

export { DEFAULT_FILTERS }
export type { FilterState }

export function useEurekaData() {
  return useContext(EurekaDataContext)
}
