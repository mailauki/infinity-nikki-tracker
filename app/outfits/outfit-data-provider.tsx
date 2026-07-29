'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { createClient } from '@/lib/supabase/client'
import { OutfitCategory, OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'
import { Label, Style, UserPreferences } from '@/lib/types/eureka'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import {
  updateOutfitFilters,
  updateOutfitGroupBySet,
  updateOutfitHideEvolutions,
  updateOutfitHideGlowups,
} from '@/app/actions/preferences'
import { handleObtainedOutfit } from '@/app/outfits/actions'
import { updateOutfitSet } from '@/hooks/outfit'
import {
  DEFAULT_OUTFIT_FILTERS,
  OutfitDataContext,
  OutfitFilterState,
} from '@/components/outfits/outfit-context'

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

// Filter changes arrive in bursts as the user adjusts several controls; collapse
// them into one preference write instead of one write per click.
const PREFERENCE_DEBOUNCE_MS = 500

export default function OutfitDataProvider({
  isLoggedIn,
  isAdmin = false,
  userId,
  children,
}: {
  isLoggedIn: boolean
  isAdmin?: boolean
  userId: string | null
  children: React.ReactNode
}) {
  const [outfitSets, setOutfitSets] = useState<OutfitSet[]>([])
  const [outfitCategories, setOutfitCategories] = useState<OutfitCategory[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [obtainedOutfit, setObtainedOutfit] = useState<ObtainedOutfit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState<boolean>(DEFAULT_PREFERENCES.outfit_group_by_set)
  const [hideEvolutions, setHideEvolutions] = useState<boolean>(
    DEFAULT_PREFERENCES.outfit_hide_evolutions
  )
  const [hideGlowups, setHideGlowups] = useState<boolean>(DEFAULT_PREFERENCES.outfit_hide_glowups)
  const [filters, setFilters] = useState<OutfitFilterState>(DEFAULT_OUTFIT_FILTERS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [, startTransition] = useTransition()
  const [isFiltering, startFilterTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchJson<{ outfitSets: OutfitSet[]; styles: Style[]; labels: Label[] }>('/api/outfits')
      .then(({ outfitSets: sets, styles: sty, labels: lbl }) => {
        setOutfitSets(sets)
        if (sets.length > 0) {
          setOutfitCategories(sets[0].outfit_categories)
        }
        setStyles(sty)
        setLabels(lbl)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load outfit data:', err)
        setIsError(true)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchJson<UserPreferences>('/api/preferences')
      .then((prefs) => {
        setGroupBySet(prefs.outfit_group_by_set)
        setHideEvolutions(prefs.outfit_hide_evolutions)
        setHideGlowups(prefs.outfit_hide_glowups)
        setFilters({
          selectedOutfitSet: prefs.outfit_set_filter ?? null,
          selectedOutfitCategory: prefs.outfit_category_filter
            ? prefs.outfit_category_filter.split(',').filter(Boolean)
            : [],
          // Stored as a string ('0' for glow-up), so check for null, not falsiness.
          selectedEvolution:
            prefs.outfit_evolution_filter !== null ? Number(prefs.outfit_evolution_filter) : null,
          selectedRarity: prefs.outfit_rarity_filter ? Number(prefs.outfit_rarity_filter) : null,
          // 'in-progress' is no longer a selectable filter; normalize any legacy
          // persisted value to null so it doesn't apply an invisible filter.
          selectedObtainedFilter:
            prefs.outfit_obtained_filter === 'missing' ||
            prefs.outfit_obtained_filter === 'obtained'
              ? (prefs.outfit_obtained_filter as ObtainedFilter)
              : null,
          selectedStyle: prefs.outfit_style_filter
            ? prefs.outfit_style_filter.split(',').filter(Boolean)
            : [],
          selectedLabel: prefs.outfit_label_filter
            ? prefs.outfit_label_filter.split(',').filter(Boolean)
            : [],
        })
        setPrefsLoaded(true)
      })
      .catch(() => {
        setPrefsLoaded(true)
      })
  }, [isLoggedIn])

  const handleGroupBySetChange = useCallback(() => {
    const next = !groupBySet
    setGroupBySet(next)
    if (isLoggedIn) startTransition(() => updateOutfitGroupBySet(next))
  }, [groupBySet, isLoggedIn])

  const handleHideEvolutionsChange = useCallback(() => {
    const next = !hideEvolutions
    setHideEvolutions(next)
    if (isLoggedIn) startTransition(() => updateOutfitHideEvolutions(next))
  }, [hideEvolutions, isLoggedIn])

  const handleHideGlowupsChange = useCallback(() => {
    const next = !hideGlowups
    setHideGlowups(next)
    if (isLoggedIn) startTransition(() => updateOutfitHideGlowups(next))
  }, [hideGlowups, isLoggedIn])

  const handleFiltersChange = useCallback((updates: Partial<OutfitFilterState>) => {
    // Mark the filter re-render interruptible: the control stays responsive and
    // React abandons in-flight work when another filter arrives. Without this the
    // ~6k-card render blocks the main thread and swallows the next click.
    startFilterTransition(() => {
      setFilters((prev) => ({ ...prev, ...updates }))
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    // Reset every control in the outfit filter menu — the filters plus the
    // grouping/evolution toggles — back to their defaults. The filters reset is
    // persisted by the [filters] effect; the toggles are persisted here. (Density
    // and image mode live in OutfitImageModeProvider and are reset separately.)
    setFilters(DEFAULT_OUTFIT_FILTERS)
    setGroupBySet(DEFAULT_PREFERENCES.outfit_group_by_set)
    setHideEvolutions(DEFAULT_PREFERENCES.outfit_hide_evolutions)
    setHideGlowups(DEFAULT_PREFERENCES.outfit_hide_glowups)
    if (isLoggedIn) {
      startTransition(() => {
        updateOutfitGroupBySet(DEFAULT_PREFERENCES.outfit_group_by_set)
        updateOutfitHideEvolutions(DEFAULT_PREFERENCES.outfit_hide_evolutions)
        updateOutfitHideGlowups(DEFAULT_PREFERENCES.outfit_hide_glowups)
      })
    }
  }, [isLoggedIn])

  const handleToggleObtained = useCallback(
    async (outfit_set: string, outfit_category: string, outfit_variant: string) => {
      const saved = obtainedOutfit
      const isObtained = obtainedOutfit.some((o) => o.outfit_variant === outfit_variant)
      if (isObtained) {
        setObtainedOutfit((prev) => prev.filter((o) => o.outfit_variant !== outfit_variant))
      } else {
        setObtainedOutfit((prev) => [
          ...prev,
          { id: -1, outfit_set, outfit_category, outfit_variant },
        ])
      }
      try {
        await handleObtainedOutfit(outfit_set, outfit_category, outfit_variant)
      } catch (err) {
        console.error('Failed to toggle obtained outfit:', err)
        setObtainedOutfit(saved)
        enqueueSnackbar('Failed to update your collection. Please try again.', {
          variant: 'error',
        })
      }
    },
    [obtainedOutfit]
  )

  const handleBatchToggleObtained = useCallback(
    async (
      variants: Array<{
        outfit_set: string
        outfit_category: string
        outfit_variant: string
      }>,
      targetObtained: boolean
    ) => {
      const saved = obtainedOutfit

      if (targetObtained) {
        setObtainedOutfit((prev) => {
          const toAdd = variants
            .filter((v) => !prev.some((o) => o.outfit_variant === v.outfit_variant))
            .map((v) => ({ id: -1, ...v }))
          return [...prev, ...toAdd]
        })
      } else {
        setObtainedOutfit((prev) =>
          prev.filter((o) => !variants.some((v) => o.outfit_variant === v.outfit_variant))
        )
      }

      for (const v of variants) {
        try {
          await handleObtainedOutfit(v.outfit_set, v.outfit_category, v.outfit_variant)
        } catch (err) {
          console.error('Failed to batch toggle obtained outfit:', err)
          setObtainedOutfit(saved)
          enqueueSnackbar('Failed to update your collection. Please try again.', {
            variant: 'error',
          })
          return
        }
      }
    },
    [obtainedOutfit]
  )

  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded) return
    // Persist filter choices as fire-and-forget: the UI must never wait on this
    // write. Server Actions are serialized, so an un-debounced write per filter
    // click queues sequential round-trips and stalls the interaction. Debouncing
    // collapses a burst of filter changes into a single write, and staying out of
    // startTransition keeps isFiltering tracking render work only.
    const id = setTimeout(() => {
      void updateOutfitFilters({
        outfit_set_filter: filters.selectedOutfitSet,
        outfit_category_filter: filters.selectedOutfitCategory.length
          ? filters.selectedOutfitCategory.join(',')
          : null,
        // selectedEvolution can be 0 (glow-up), so persist on null — not falsiness.
        outfit_evolution_filter:
          filters.selectedEvolution !== null ? String(filters.selectedEvolution) : null,
        outfit_rarity_filter: filters.selectedRarity ? String(filters.selectedRarity) : null,
        outfit_obtained_filter: filters.selectedObtainedFilter,
        outfit_style_filter: filters.selectedStyle.length ? filters.selectedStyle.join(',') : null,
        outfit_label_filter: filters.selectedLabel.length ? filters.selectedLabel.join(',') : null,
      }).catch((err) => {
        // A failed preference write must not disrupt filtering — the user's
        // filters still work, they just may not persist across a reload.
        console.error('Failed to persist outfit filters:', err)
      })
    }, PREFERENCE_DEBOUNCE_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (!isLoggedIn) return

    fetchJson<ObtainedOutfit[]>('/api/obtained-outfit')
      .then((data) => setObtainedOutfit(data))
      .catch((err) => {
        console.error('Failed to load obtained outfit:', err)
        setIsObtainedError(true)
      })

    const channel = supabase
      .channel(`obtained-outfit-channel:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'obtained_outfit',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as ObtainedOutfit
          setObtainedOutfit((prev) => {
            const withoutPlaceholder = prev.filter(
              (o) => !(o.id === -1 && o.outfit_variant === incoming.outfit_variant)
            )
            if (withoutPlaceholder.some((o) => o.id === incoming.id)) return prev
            return [...withoutPlaceholder, incoming]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'obtained_outfit',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setObtainedOutfit((prev) => prev.filter((o) => o.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const outfitSetsWithObtained = useMemo(
    () => outfitSets.map((outfitSet) => updateOutfitSet({ outfitSet, obtainedOutfit })),
    [outfitSets, obtainedOutfit]
  )

  const contextValue = useMemo(
    () => ({
      outfitSets: outfitSetsWithObtained,
      obtainedOutfit,
      outfitCategories,
      styles,
      labels,
      isLoggedIn,
      isAdmin,
      isLoading,
      isError,
      isObtainedError,
      isFiltering,
      userId,
      groupBySet,
      hideEvolutions,
      hideGlowups,
      onGroupBySetChange: handleGroupBySetChange,
      onHideEvolutionsChange: handleHideEvolutionsChange,
      onHideGlowupsChange: handleHideGlowupsChange,
      filters,
      onFiltersChange: handleFiltersChange,
      onClearFilters: handleClearFilters,
      onToggleObtained: handleToggleObtained,
      onBatchToggleObtained: handleBatchToggleObtained,
    }),
    [
      outfitSetsWithObtained,
      obtainedOutfit,
      outfitCategories,
      styles,
      labels,
      isLoggedIn,
      isAdmin,
      isLoading,
      isError,
      isObtainedError,
      isFiltering,
      userId,
      groupBySet,
      hideEvolutions,
      hideGlowups,
      handleGroupBySetChange,
      handleHideEvolutionsChange,
      handleHideGlowupsChange,
      filters,
      handleFiltersChange,
      handleClearFilters,
      handleToggleObtained,
      handleBatchToggleObtained,
    ]
  )

  return <OutfitDataContext.Provider value={contextValue}>{children}</OutfitDataContext.Provider>
}
