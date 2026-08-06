'use client'

import { useEffect, useState } from 'react'
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

// Filter changes arrive in bursts as the season/season-category multi-selects
// emit one onChange per checkbox click; collapse them into one preference write
// instead of racing several concurrent upserts on the same user_preferences row.
const PREFERENCE_DEBOUNCE_MS = 500

export default function MomoCloakDataProvider({
  cloaks,
  obtainedSlugs: initialObtained,
  isLoggedIn,
  isObtainedError = false,
  isError = false,
  children,
}: {
  cloaks: MomoCloak[]
  obtainedSlugs: string[]
  isLoggedIn: boolean
  isObtainedError?: boolean
  isError?: boolean
  children: React.ReactNode
}) {
  const [obtainedSlugs, setObtainedSlugs] = useState<Set<string>>(() => new Set(initialObtained))
  const [filters, setFilters] = useState<MomoCloakFilterState>(DEFAULT_MOMO_FILTERS)

  // Gates the persistence effect below: without it, the effect fires on mount
  // with DEFAULT_MOMO_FILTERS and overwrites the user's saved filters with nulls
  // before the hydrate fetch has even landed. State (not a ref) so the gate's
  // transition is ordered with the filter state it guards — a ref flip doesn't
  // trigger a re-render, so the persist effect could see stale `filters` and
  // either replay the just-read values back or clobber a change the user made
  // mid-hydration.
  const [prefsLoaded, setPrefsLoaded] = useState(false)

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
        setPrefsLoaded(true)
      })
      .catch(() => {
        // A failed preference read is not fatal — fall back to defaults and still
        // allow subsequent writes.
        setPrefsLoaded(true)
      })
  }, [isLoggedIn])

  // Persist filters whenever they change, after hydration. savePreferences —
  // NOT a Server Action: a cookie-setting action would mark its response
  // revalidated, remount this provider, and refire on every toggle. Debouncing
  // collapses a burst of filter changes (e.g. five season checkboxes clicked in
  // a row) into a single write, avoiding concurrent upserts racing on the same
  // user_preferences row.
  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded) return
    const id = setTimeout(() => {
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
    }, PREFERENCE_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [filters, prefsLoaded, isLoggedIn])

  const handleFiltersChange = (updates: Partial<MomoCloakFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_MOMO_FILTERS)
  }

  const handleToggleObtained = async (slug: string) => {
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
      // Roll back only this slug rather than restoring a snapshot: if another
      // toggle (e.g. a different cloak) succeeded while this RPC was in flight,
      // a full snapshot restore would silently revert that unrelated change too.
      setObtainedSlugs((prev) => {
        const next = new Set(prev)
        if (next.has(slug)) next.delete(slug)
        else next.add(slug)
        return next
      })
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
        isError,
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
