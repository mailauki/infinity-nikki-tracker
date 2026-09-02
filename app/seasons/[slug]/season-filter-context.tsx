'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { savePreferences } from '@/lib/save-preferences'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import type { UserPreferences } from '@/lib/types/eureka'
import type { SeasonFilters } from './season-entries'

export type SeasonDensity = 'standard' | 'compact'

// A failed preference write must not disrupt filtering — the user's choices
// still apply for this session, they just may not persist across a reload.
// Mirrors app/outfits/outfit-data-provider.tsx.
const persistFailed = (err: unknown) => {
  console.error('Failed to persist season preferences:', err)
}

interface SeasonFilterContextValue {
  // The base state of every set (outfit and makeup) — the set as first obtained,
  // before any evolution.
  hideBaseSets: boolean
  hideEvolutions: boolean
  hideGlowups: boolean
  // Standalone pieces are individually-authored variants rather than sets, and a
  // season can hold far more of them than sets (129 vs 130 on the launch season),
  // so they get their own toggle. Makeup sets are unaffected — they are sets.
  hidePieces: boolean
  // Makeup sets are a separate collection domain that shares a season, so they
  // get their own toggle rather than riding along with the pieces one.
  hideMakeup: boolean
  onHideBaseSetsChange: () => void
  onHideEvolutionsChange: () => void
  onHideGlowupsChange: () => void
  onHidePiecesChange: () => void
  onHideMakeupChange: () => void
  // Shows or hides every kind at once. Together the five flags cover everything a
  // season can display, so "show all" genuinely means all.
  onSetAllVisible: (visible: boolean) => void
  density: SeasonDensity
  onDensityChange: (density: SeasonDensity) => void
  filters: SeasonFilters
  onFiltersChange: (updates: Partial<SeasonFilters>) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const SeasonFilterContext = createContext<SeasonFilterContextValue | null>(null)

const DEFAULT_FILTERS: SeasonFilters = { obtained: null, rarity: null, styles: [] }

export function SeasonFilterProvider({
  children,
  isLoggedIn = false,
  preferences,
}: {
  children: React.ReactNode
  isLoggedIn?: boolean
  preferences?: Partial<UserPreferences>
}) {
  const [hideBaseSets, setHideBaseSets] = useState(
    preferences?.season_hide_base_sets ?? DEFAULT_PREFERENCES.season_hide_base_sets
  )
  // Evolutions and glow-ups start hidden. A season page answers "what does this
  // season contain", and an evolution is another state of a set the season
  // already lists rather than another thing to collect — so counting them by
  // default inflated every category against what the season actually offers.
  // Both toggles are still there for anyone who wants the full set graph.
  const [hideEvolutions, setHideEvolutions] = useState(
    preferences?.season_hide_evolutions ?? DEFAULT_PREFERENCES.season_hide_evolutions
  )
  const [hideGlowups, setHideGlowups] = useState(
    preferences?.season_hide_glowups ?? DEFAULT_PREFERENCES.season_hide_glowups
  )
  const [hidePieces, setHidePieces] = useState(
    preferences?.season_hide_pieces ?? DEFAULT_PREFERENCES.season_hide_pieces
  )
  const [hideMakeup, setHideMakeup] = useState(
    preferences?.season_hide_makeup ?? DEFAULT_PREFERENCES.season_hide_makeup
  )
  const [density, setDensity] = useState<SeasonDensity>(
    ((preferences?.season_density ?? DEFAULT_PREFERENCES.season_density) as SeasonDensity | null) ??
      'standard'
  )
  const rawRarity = preferences?.season_rarity_filter ?? DEFAULT_PREFERENCES.season_rarity_filter
  const [filters, setFilters] = useState<SeasonFilters>({
    obtained: (preferences?.season_obtained_filter ??
      DEFAULT_PREFERENCES.season_obtained_filter) as SeasonFilters['obtained'],
    rarity: rawRarity ? Number(rawRarity) : null,
    styles: preferences?.season_style_filter
      ? preferences.season_style_filter.split(',').filter(Boolean)
      : [],
  })

  const onHideBaseSetsChange = useCallback(() => {
    setHideBaseSets((prev) => {
      const next = !prev
      if (isLoggedIn) void savePreferences({ season_hide_base_sets: next }).catch(persistFailed)
      return next
    })
  }, [isLoggedIn])

  const onHideEvolutionsChange = useCallback(() => {
    setHideEvolutions((prev) => {
      const next = !prev
      if (isLoggedIn) void savePreferences({ season_hide_evolutions: next }).catch(persistFailed)
      return next
    })
  }, [isLoggedIn])

  const onHideGlowupsChange = useCallback(() => {
    setHideGlowups((prev) => {
      const next = !prev
      if (isLoggedIn) void savePreferences({ season_hide_glowups: next }).catch(persistFailed)
      return next
    })
  }, [isLoggedIn])

  const onHidePiecesChange = useCallback(() => {
    setHidePieces((prev) => {
      const next = !prev
      if (isLoggedIn) void savePreferences({ season_hide_pieces: next }).catch(persistFailed)
      return next
    })
  }, [isLoggedIn])

  const onHideMakeupChange = useCallback(() => {
    setHideMakeup((prev) => {
      const next = !prev
      if (isLoggedIn) void savePreferences({ season_hide_makeup: next }).catch(persistFailed)
      return next
    })
  }, [isLoggedIn])

  // `visible` is the user-facing sense, so hiding everything means setting every
  // hide-flag true.
  const onSetAllVisible = useCallback(
    (visible: boolean) => {
      const hidden = !visible
      setHideBaseSets(hidden)
      setHideEvolutions(hidden)
      setHideGlowups(hidden)
      setHidePieces(hidden)
      setHideMakeup(hidden)
      if (isLoggedIn) {
        void savePreferences({
          season_hide_base_sets: hidden,
          season_hide_evolutions: hidden,
          season_hide_glowups: hidden,
          season_hide_pieces: hidden,
          season_hide_makeup: hidden,
        }).catch(persistFailed)
      }
    },
    [isLoggedIn]
  )

  const onDensityChange = useCallback(
    (next: SeasonDensity) => {
      setDensity(next)
      if (isLoggedIn) void savePreferences({ season_density: next }).catch(persistFailed)
    },
    [isLoggedIn]
  )

  const onFiltersChange = useCallback(
    (updates: Partial<SeasonFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...updates }
        if (isLoggedIn) {
          void savePreferences({
            season_obtained_filter: next.obtained,
            season_rarity_filter: next.rarity,
            season_style_filter: next.styles.length ? next.styles.join(',') : null,
          }).catch(persistFailed)
        }
        return next
      })
    },
    [isLoggedIn]
  )

  const onClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    if (isLoggedIn) {
      void savePreferences({
        season_obtained_filter: null,
        season_rarity_filter: null,
        season_style_filter: null,
      }).catch(persistFailed)
    }
  }, [isLoggedIn])

  const hasActiveFilters =
    hideBaseSets !== DEFAULT_PREFERENCES.season_hide_base_sets ||
    hideEvolutions !== DEFAULT_PREFERENCES.season_hide_evolutions ||
    hideGlowups !== DEFAULT_PREFERENCES.season_hide_glowups ||
    hidePieces !== DEFAULT_PREFERENCES.season_hide_pieces ||
    hideMakeup !== DEFAULT_PREFERENCES.season_hide_makeup ||
    density !== 'standard' ||
    filters.obtained !== null ||
    filters.rarity !== null ||
    filters.styles.length > 0

  const value = useMemo<SeasonFilterContextValue>(
    () => ({
      hideBaseSets,
      hideEvolutions,
      hideGlowups,
      hidePieces,
      hideMakeup,
      onHideBaseSetsChange,
      onHideEvolutionsChange,
      onHideGlowupsChange,
      onHidePiecesChange,
      onHideMakeupChange,
      onSetAllVisible,
      density,
      onDensityChange,
      filters,
      onFiltersChange,
      onClearFilters,
      hasActiveFilters,
    }),
    [
      hideBaseSets,
      hideEvolutions,
      hideGlowups,
      hidePieces,
      hideMakeup,
      onHideBaseSetsChange,
      onHideEvolutionsChange,
      onHideGlowupsChange,
      onHidePiecesChange,
      onHideMakeupChange,
      onSetAllVisible,
      density,
      onDensityChange,
      filters,
      onFiltersChange,
      onClearFilters,
      hasActiveFilters,
    ]
  )

  return <SeasonFilterContext.Provider value={value}>{children}</SeasonFilterContext.Provider>
}

export function useSeasonFilter() {
  const ctx = useContext(SeasonFilterContext)
  if (!ctx) throw new Error('useSeasonFilter must be used within SeasonFilterProvider')
  return ctx
}

// Non-throwing variant for shared components (e.g. SlugToolBar) that render on
// many slug pages but only show the season toggles when wrapped in the provider.
export function useSeasonFilterOptional() {
  return useContext(SeasonFilterContext)
}
