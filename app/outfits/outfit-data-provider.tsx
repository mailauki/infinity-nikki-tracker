'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { createClient } from '@/lib/supabase/client'
import { OutfitCategory, OutfitSet, OutfitVariant, ObtainedOutfit } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'
import { UserPreferences } from '@/lib/types/eureka'
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
  const [standaloneVariants, setStandaloneVariants] = useState<OutfitVariant[]>([])
  const [outfitCategories, setOutfitCategories] = useState<OutfitCategory[]>([])
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
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchJson<{ outfitSets: OutfitSet[]; standaloneVariants: OutfitVariant[] }>('/api/outfits')
      .then(({ outfitSets: sets, standaloneVariants: standalone }) => {
        setOutfitSets(sets)
        setStandaloneVariants(standalone)
        if (sets.length > 0) {
          setOutfitCategories(sets[0].outfit_categories)
        }
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
        })
        setPrefsLoaded(true)
      })
      .catch(() => {
        setPrefsLoaded(true)
      })
  }, [isLoggedIn])

  const handleGroupBySetChange = () => {
    const next = !groupBySet
    setGroupBySet(next)
    if (isLoggedIn) startTransition(() => updateOutfitGroupBySet(next))
  }

  const handleHideEvolutionsChange = () => {
    const next = !hideEvolutions
    setHideEvolutions(next)
    if (isLoggedIn) startTransition(() => updateOutfitHideEvolutions(next))
  }

  const handleHideGlowupsChange = () => {
    const next = !hideGlowups
    setHideGlowups(next)
    if (isLoggedIn) startTransition(() => updateOutfitHideGlowups(next))
  }

  const handleFiltersChange = (updates: Partial<OutfitFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
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
  }

  const handleToggleObtained = async (outfit_set: string, outfit_category: string) => {
    const saved = obtainedOutfit
    const isObtained = obtainedOutfit.some(
      (o) => o.outfit_set === outfit_set && o.outfit_category === outfit_category
    )
    if (isObtained) {
      setObtainedOutfit((prev) =>
        prev.filter((o) => !(o.outfit_set === outfit_set && o.outfit_category === outfit_category))
      )
    } else {
      setObtainedOutfit((prev) => [...prev, { id: -1, outfit_set, outfit_category }])
    }
    try {
      await handleObtainedOutfit(outfit_set, outfit_category)
    } catch (err) {
      console.error('Failed to toggle obtained outfit:', err)
      setObtainedOutfit(saved)
      enqueueSnackbar('Failed to update your collection. Please try again.', { variant: 'error' })
    }
  }

  const handleBatchToggleObtained = async (
    variants: Array<{ outfit_set: string; outfit_category: string }>,
    targetObtained: boolean
  ) => {
    const saved = obtainedOutfit
    const matches = (
      o: { outfit_set: string; outfit_category: string },
      v: { outfit_set: string; outfit_category: string }
    ) => o.outfit_set === v.outfit_set && o.outfit_category === v.outfit_category

    if (targetObtained) {
      setObtainedOutfit((prev) => {
        const toAdd = variants
          .filter((v) => !prev.some((o) => matches(o, v)))
          .map((v) => ({ id: -1, ...v }))
        return [...prev, ...toAdd]
      })
    } else {
      setObtainedOutfit((prev) => prev.filter((o) => !variants.some((v) => matches(o, v))))
    }

    for (const v of variants) {
      try {
        await handleObtainedOutfit(v.outfit_set, v.outfit_category)
      } catch (err) {
        console.error('Failed to batch toggle obtained outfit:', err)
        setObtainedOutfit(saved)
        enqueueSnackbar('Failed to update your collection. Please try again.', { variant: 'error' })
        return
      }
    }
  }

  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded) return
    startTransition(() =>
      updateOutfitFilters({
        outfit_set_filter: filters.selectedOutfitSet,
        outfit_category_filter: filters.selectedOutfitCategory.length
          ? filters.selectedOutfitCategory.join(',')
          : null,
        // selectedEvolution can be 0 (glow-up), so persist on null — not falsiness.
        outfit_evolution_filter:
          filters.selectedEvolution !== null ? String(filters.selectedEvolution) : null,
        outfit_rarity_filter: filters.selectedRarity ? String(filters.selectedRarity) : null,
        outfit_obtained_filter: filters.selectedObtainedFilter,
      })
    )
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
              (o) =>
                !(
                  o.id === -1 &&
                  o.outfit_set === incoming.outfit_set &&
                  o.outfit_category === incoming.outfit_category
                )
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

  const outfitSetsWithObtained = outfitSets.map((outfitSet) =>
    updateOutfitSet({ outfitSet, obtainedOutfit })
  )

  return (
    <OutfitDataContext.Provider
      value={{
        outfitSets: outfitSetsWithObtained,
        standaloneVariants,
        obtainedOutfit,
        outfitCategories,
        isLoggedIn,
        isAdmin,
        isLoading,
        isError,
        isObtainedError,
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
      }}
    >
      {children}
    </OutfitDataContext.Provider>
  )
}
