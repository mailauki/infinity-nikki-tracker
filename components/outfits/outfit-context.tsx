'use client'

import { createContext, useContext } from 'react'
import { OutfitCategory, OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { ObtainedFilter } from '@/lib/types/props'

export interface OutfitFilterState {
  selectedOutfitSet: string | null
  selectedOutfitCategory: string[]
  selectedEvolution: number | null
  selectedRarity: number | null
  selectedObtainedFilter: ObtainedFilter | null
  selectedStyle: string[]
  selectedLabel: string[]
}

interface OutfitDataContextValue {
  outfitSets: OutfitSet[]
  obtainedOutfit: ObtainedOutfit[]
  outfitCategories: OutfitCategory[]
  styles: Style[]
  labels: Label[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  userId: string | null
  groupBySet: boolean
  hideEvolutions: boolean
  hideGlowups: boolean
  onGroupBySetChange: () => void
  onHideEvolutionsChange: () => void
  onHideGlowupsChange: () => void
  filters: OutfitFilterState
  onFiltersChange: (updates: Partial<OutfitFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (outfit_set: string, outfit_category: string, outfit_variant: string) => void
  onBatchToggleObtained: (
    variants: Array<{
      outfit_set: string
      outfit_category: string
      outfit_variant: string
    }>,
    targetObtained: boolean
  ) => void
}

export const DEFAULT_OUTFIT_FILTERS: OutfitFilterState = {
  selectedOutfitSet: null,
  selectedOutfitCategory: [],
  selectedEvolution: null,
  selectedRarity: null,
  selectedObtainedFilter: null,
  selectedStyle: [],
  selectedLabel: [],
}

export const OutfitDataContext = createContext<OutfitDataContextValue>({
  outfitSets: [],
  obtainedOutfit: [],
  outfitCategories: [],
  styles: [],
  labels: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  userId: null,
  groupBySet: true,
  hideEvolutions: false,
  hideGlowups: false,
  onGroupBySetChange: () => {},
  onHideEvolutionsChange: () => {},
  onHideGlowupsChange: () => {},
  filters: DEFAULT_OUTFIT_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
  onBatchToggleObtained: () => {},
})

export function useOutfitData() {
  return useContext(OutfitDataContext)
}
