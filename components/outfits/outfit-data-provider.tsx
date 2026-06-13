'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OutfitCategory, OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'
import { UserPreferences } from '@/lib/types/eureka'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import {
  updateOutfitFilters,
  updateOutfitGroupBySet,
  updateOutfitHideEvolutions,
} from '@/app/actions/preferences'
import { handleObtainedOutfit } from '@/app/outfits/actions'
import { updateOutfitSet } from '@/hooks/outfit'
import { DEFAULT_OUTFIT_FILTERS, OutfitDataContext, OutfitFilterState } from './outfit-context'

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
  const [outfitCategories, setOutfitCategories] = useState<OutfitCategory[]>([])
  const [obtainedOutfit, setObtainedOutfit] = useState<ObtainedOutfit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState<boolean>(DEFAULT_PREFERENCES.outfit_group_by_set)
  const [hideEvolutions, setHideEvolutions] = useState<boolean>(
    DEFAULT_PREFERENCES.outfit_hide_evolutions
  )
  const [filters, setFilters] = useState<OutfitFilterState>(DEFAULT_OUTFIT_FILTERS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchJson<OutfitSet[]>('/api/outfits')
      .then((sets) => {
        setOutfitSets(sets)
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
        setFilters({
          selectedOutfitSet: prefs.outfit_set_filter ?? null,
          selectedOutfitCategory: prefs.outfit_category_filter
            ? prefs.outfit_category_filter.split(',').filter(Boolean)
            : [],
          selectedEvolution: prefs.outfit_evolution_filter ?? null,
          selectedRarity: prefs.outfit_rarity_filter ? Number(prefs.outfit_rarity_filter) : null,
          selectedObtainedFilter: (prefs.outfit_obtained_filter as ObtainedFilter) ?? null,
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

  const handleFiltersChange = (updates: Partial<OutfitFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_OUTFIT_FILTERS)
  }

  const handleToggleObtained = (
    outfit_set: string,
    outfit_category: string,
    evolution: string | null
  ) => {
    const isObtained = obtainedOutfit.some(
      (o) =>
        o.outfit_set === outfit_set &&
        o.outfit_category === outfit_category &&
        (evolution === null ? o.evolution === null : o.evolution === evolution)
    )
    if (isObtained) {
      setObtainedOutfit((prev) =>
        prev.filter(
          (o) =>
            !(
              o.outfit_set === outfit_set &&
              o.outfit_category === outfit_category &&
              (evolution === null ? o.evolution === null : o.evolution === evolution)
            )
        )
      )
    } else {
      setObtainedOutfit((prev) => [...prev, { id: -1, outfit_set, outfit_category, evolution }])
    }
    handleObtainedOutfit(outfit_set, outfit_category, evolution)
  }

  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded) return
    startTransition(() =>
      updateOutfitFilters({
        outfit_set_filter: filters.selectedOutfitSet,
        outfit_category_filter: filters.selectedOutfitCategory.length
          ? filters.selectedOutfitCategory.join(',')
          : null,
        outfit_evolution_filter: filters.selectedEvolution,
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
          setObtainedOutfit((prev) => [...prev, payload.new as ObtainedOutfit])
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
        onGroupBySetChange: handleGroupBySetChange,
        onHideEvolutionsChange: handleHideEvolutionsChange,
        filters,
        onFiltersChange: handleFiltersChange,
        onClearFilters: handleClearFilters,
        onToggleObtained: handleToggleObtained,
      }}
    >
      {children}
    </OutfitDataContext.Provider>
  )
}
