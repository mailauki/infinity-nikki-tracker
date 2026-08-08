'use client'

import { useMemo } from 'react'

import { MomoCloak } from '@/lib/types/momo'

import { useMomoCloakData } from './momo-cloak-context'

// The filter pipeline, shared by the grid and the results bar.
//
// The outfits and eureka results bars each re-implement their page's filter
// pipeline to compute the same number, with a comment asking the next editor to
// keep the two copies aligned. Cloak filters already live in context, so both
// consumers call this instead — the count cannot disagree with what is rendered
// because it is derived from the same array.
export function useVisibleCloaks(): MomoCloak[] {
  const { cloaks, obtainedSlugs, isLoggedIn, filters } = useMomoCloakData()
  const {
    selectedRarity,
    selectedSeason,
    selectedSeasonCategory,
    selectedLocation,
    selectedObtainedFilter,
  } = filters

  return useMemo(
    () =>
      cloaks.filter((cloak) => {
        if (selectedRarity !== null && cloak.rarity !== selectedRarity) return false
        if (selectedSeason.length > 0 && !selectedSeason.includes(cloak.seasons ?? '')) return false
        if (
          selectedSeasonCategory.length > 0 &&
          !selectedSeasonCategory.includes(cloak.season_category ?? '')
        )
          return false
        if (selectedLocation !== null && cloak.location !== selectedLocation) return false
        // The obtained filter is meaningless logged out — every cloak reads as
        // not-obtained — so it only applies for signed-in users.
        if (isLoggedIn && selectedObtainedFilter) {
          const isObtained = obtainedSlugs.has(cloak.slug)
          if (selectedObtainedFilter === 'obtained' && !isObtained) return false
          if (selectedObtainedFilter === 'missing' && isObtained) return false
        }
        return true
      }),
    [
      cloaks,
      obtainedSlugs,
      isLoggedIn,
      selectedRarity,
      selectedSeason,
      selectedSeasonCategory,
      selectedLocation,
      selectedObtainedFilter,
    ]
  )
}
