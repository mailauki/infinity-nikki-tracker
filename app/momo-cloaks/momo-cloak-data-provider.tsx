'use client'

import { useEffect, useRef, useState } from 'react'
import { enqueueSnackbar } from 'notistack'

import { handleObtainedMomoCloak } from '@/app/momo-cloaks/actions'
import { fetchPreferencesOnce } from '@/lib/preferences-cache'
import { savePreferences } from '@/lib/save-preferences'
import { MomoCloak } from '@/lib/types/momo'
import { ObtainedFilter } from '@/lib/types/props'

import {
  DEFAULT_MOMO_FILTERS,
  MomoCloakDataContext,
  MomoCloakFilterState,
} from './momo-cloak-context'

export default function MomoCloakDataProvider({
  cloaks,
  obtainedSlugs: initialObtained,
  isLoggedIn,
  isObtainedError = false,
  children,
}: {
  cloaks: MomoCloak[]
  obtainedSlugs: string[]
  isLoggedIn: boolean
  isObtainedError?: boolean
  children: React.ReactNode
}) {
  const [obtainedSlugs, setObtainedSlugs] = useState<Set<string>>(() => new Set(initialObtained))
  const [filters, setFilters] = useState<MomoCloakFilterState>(DEFAULT_MOMO_FILTERS)

  // Gates the persistence effect below: without it, the effect fires on mount
  // with DEFAULT_MOMO_FILTERS and overwrites the user's saved filters with nulls
  // before the hydrate fetch has even landed.
  const prefsLoaded = useRef(false)

  useEffect(() => {
    if (!isLoggedIn) return
    fetchPreferencesOnce()
      .then((prefs) => {
        setFilters({
          selectedRarity: prefs.momo_rarity_filter
            ? Number(prefs.momo_rarity_filter) || null
            : null,
          selectedSeason: prefs.momo_season_filter
            ? prefs.momo_season_filter.split(',').filter(Boolean)
            : [],
          selectedSeasonCategory: prefs.momo_season_category_filter
            ? prefs.momo_season_category_filter.split(',').filter(Boolean)
            : [],
          selectedObtainedFilter: (prefs.momo_obtained_filter as ObtainedFilter) ?? null,
        })
        prefsLoaded.current = true
      })
      .catch(() => {
        // A failed preference read is not fatal — fall back to defaults and still
        // allow subsequent writes.
        prefsLoaded.current = true
      })
  }, [isLoggedIn])

  // Persist filters whenever they change, after hydration. savePreferences —
  // NOT a Server Action: a cookie-setting action would mark its response
  // revalidated, remount this provider, and refire on every toggle.
  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded.current) return
    savePreferences({
      momo_rarity_filter: filters.selectedRarity ? String(filters.selectedRarity) : null,
      momo_season_filter: filters.selectedSeason.length ? filters.selectedSeason.join(',') : null,
      momo_season_category_filter: filters.selectedSeasonCategory.length
        ? filters.selectedSeasonCategory.join(',')
        : null,
      momo_obtained_filter: filters.selectedObtainedFilter,
    }).catch((err) => {
      // Non-blocking: the filter still applies in-session.
      console.error('Failed to persist momo cloak filters:', err)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleFiltersChange = (updates: Partial<MomoCloakFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_MOMO_FILTERS)
  }

  const handleToggleObtained = async (slug: string) => {
    const saved = obtainedSlugs
    setObtainedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
    try {
      await handleObtainedMomoCloak(slug)
    } catch (err) {
      console.error('Failed to toggle obtained momo cloak:', err)
      setObtainedSlugs(saved)
      enqueueSnackbar('Failed to update your collection. Please try again.', { variant: 'error' })
    }
  }

  return (
    <MomoCloakDataContext.Provider
      value={{
        cloaks,
        obtainedSlugs,
        isLoggedIn,
        isObtainedError,
        filters,
        onFiltersChange: handleFiltersChange,
        onClearFilters: handleClearFilters,
        onToggleObtained: handleToggleObtained,
      }}
    >
      {children}
    </MomoCloakDataContext.Provider>
  )
}
