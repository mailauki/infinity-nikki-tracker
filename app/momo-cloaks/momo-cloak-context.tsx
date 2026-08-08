'use client'

import { createContext, useContext } from 'react'

import { MomoCloak } from '@/lib/types/momo'
import { ObtainedFilter } from '@/lib/types/props'

// Season and season-category are multi-select (11 and 3 distinct values in the
// data) so they mirror the outfits page's string[] shape. Rarity, location, and
// obtained are exclusive toggles, matching eureka. Location has only two values
// in the data (wishfield, itzaland), so a pair of toggle buttons beats a select.
export interface MomoCloakFilterState {
  selectedRarity: number | null
  selectedSeason: string[]
  selectedSeasonCategory: string[]
  selectedLocation: string | null
  selectedObtainedFilter: ObtainedFilter | null
}

export const DEFAULT_MOMO_FILTERS: MomoCloakFilterState = {
  selectedRarity: null,
  selectedSeason: [],
  selectedSeasonCategory: [],
  selectedLocation: null,
  selectedObtainedFilter: null,
}

interface MomoCloakDataContextValue {
  cloaks: MomoCloak[]
  /** Slugs of cloaks the signed-in user has obtained. O(1) lookups. */
  obtainedSlugs: Set<string>
  isLoggedIn: boolean
  /** The cloaks themselves loaded, but the obtained rows failed — toggles disabled. */
  isObtainedError: boolean
  /** The cloak fetch itself failed — no data to show, render an ErrorAlert. */
  isError: boolean
  filters: MomoCloakFilterState
  onFiltersChange: (updates: Partial<MomoCloakFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (slug: string) => void
}

export const MomoCloakDataContext = createContext<MomoCloakDataContextValue>({
  cloaks: [],
  obtainedSlugs: new Set(),
  isLoggedIn: false,
  isObtainedError: false,
  isError: false,
  filters: DEFAULT_MOMO_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
})

export function useMomoCloakData() {
  return useContext(MomoCloakDataContext)
}
