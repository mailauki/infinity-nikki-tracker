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
  hideEvolutions: boolean
  onGroupBySetChange: () => void
  onHideEvolutionsChange: () => void
  filters: OutfitFilterState
  onFiltersChange: (updates: Partial<OutfitFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (outfit_set: string, outfit_category: string, evolution: string) => void
  onBatchToggleObtained: (
    variants: Array<{ outfit_set: string; outfit_category: string; evolution: string | null }>,
    targetObtained: boolean
  ) => void
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
  hideEvolutions: false,
  onGroupBySetChange: () => {},
  onHideEvolutionsChange: () => {},
  filters: DEFAULT_OUTFIT_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
  onBatchToggleObtained: () => {},
})

export function useOutfitData() {
  return useContext(OutfitDataContext)
}
