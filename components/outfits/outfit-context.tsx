'use client'

import { createContext, useContext } from 'react'
import { OutfitCategory, OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'

export interface OutfitFilterState {
  selectedOutfitSet: string | null
  selectedOutfitCategory: string[]
  selectedEvolution: string | null
  selectedRarity: number | null
  selectedObtainedFilter: ObtainedFilter | null
}

interface OutfitDataContextValue {
  outfitSets: OutfitSet[]
  obtainedOutfit: ObtainedOutfit[]
  outfitCategories: OutfitCategory[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  userId: string | null
  groupBySet: boolean
  showByEvolution: boolean
  hideEvolutions: boolean
  onGroupBySetChange: () => void
  onShowByEvolutionChange: () => void
  onHideEvolutionsChange: () => void
  filters: OutfitFilterState
  onFiltersChange: (updates: Partial<OutfitFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (outfit_set: string, outfit_category: string, evolution: string | null) => void
}

export const DEFAULT_OUTFIT_FILTERS: OutfitFilterState = {
  selectedOutfitSet: null,
  selectedOutfitCategory: [],
  selectedEvolution: null,
  selectedRarity: null,
  selectedObtainedFilter: null,
}

export const OutfitDataContext = createContext<OutfitDataContextValue>({
  outfitSets: [],
  obtainedOutfit: [],
  outfitCategories: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  userId: null,
  groupBySet: true,
  showByEvolution: false,
  hideEvolutions: false,
  onGroupBySetChange: () => {},
  onShowByEvolutionChange: () => {},
  onHideEvolutionsChange: () => {},
  filters: DEFAULT_OUTFIT_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
})

export function useOutfitData() {
  return useContext(OutfitDataContext)
}
