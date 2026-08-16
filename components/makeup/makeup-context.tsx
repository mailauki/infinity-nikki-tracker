'use client'

import { createContext, useContext } from 'react'
import { MakeupCategory, MakeupSet, ObtainedMakeup } from '@/lib/types/makeup'
import { Style } from '@/lib/types/eureka'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'

export interface MakeupFilterState {
  selectedMakeupSet: string | null
  selectedMakeupCategory: string[]
  selectedRarity: number | null
  selectedObtainedFilter: ObtainedFilter | null
  selectedStyle: string[]
  selectedSeason: string[]
  selectedSeasonCategory: string[]
}

interface MakeupDataContextValue {
  makeupSets: MakeupSet[]
  obtainedMakeup: ObtainedMakeup[]
  makeupCategories: MakeupCategory[]
  styles: Style[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  isFiltering: boolean
  userId: string | null
  groupBySet: boolean
  onGroupBySetChange: () => void
  filters: MakeupFilterState
  onFiltersChange: (updates: Partial<MakeupFilterState>) => void
  onClearFilters: () => void
  // Variant keys currently animating out under the "missing" filter. The filter
  // pipeline keeps them visible until the animation finishes — see
  // hooks/use-exit-hold.ts.
  exitingKeys: ReadonlySet<string>
  onHoldExit: (keys: string[]) => void
  onToggleObtained: (makeup_set: string, makeup_category: string, makeup_variant: string) => void
  onBatchToggleObtained: (
    variants: Array<{ makeup_set: string; makeup_category: string; makeup_variant: string }>,
    targetObtained: boolean
  ) => void
}

export const DEFAULT_MAKEUP_FILTERS: MakeupFilterState = {
  selectedMakeupSet: null,
  selectedMakeupCategory: [],
  selectedRarity: null,
  selectedObtainedFilter: null,
  selectedStyle: [],
  selectedSeason: [],
  selectedSeasonCategory: [],
}

export const MakeupDataContext = createContext<MakeupDataContextValue>({
  makeupSets: [],
  obtainedMakeup: [],
  makeupCategories: [],
  styles: [],
  seasons: [],
  seasonCategories: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  isFiltering: false,
  userId: null,
  groupBySet: true,
  onGroupBySetChange: () => {},
  filters: DEFAULT_MAKEUP_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  exitingKeys: new Set<string>(),
  onHoldExit: () => {},
  onToggleObtained: () => {},
  onBatchToggleObtained: () => {},
})

export function useMakeupData() {
  return useContext(MakeupDataContext)
}
