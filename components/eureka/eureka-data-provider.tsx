'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import {
  EurekaCategory,
  EurekaColor,
  EurekaSet,
  ObtainedEureka,
  Trial,
  UserPreferences,
} from '@/lib/types/eureka'
import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import { updateEurekaFilters, updateGroupBySet, updateShowByColor } from '@/app/actions/preferences'
import { handleObtained } from '@/app/eureka/actions'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'

import { DEFAULT_FILTERS, EurekaDataContext, FilterState } from './eureka-context'

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

export default function EurekaDataProvider({
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
  const [eurekaSets, setEurekaSets] = useState<EurekaSet[]>([])
  const [categories, setCategories] = useState<EurekaCategory[]>([])
  const [colors, setColors] = useState<EurekaColor[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [obtainedEureka, setObtainedEureka] = useState<ObtainedEureka[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState<boolean>(DEFAULT_PREFERENCES.group_by_set)
  const [showByColor, setShowByColor] = useState<boolean>(DEFAULT_PREFERENCES.show_by_color)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])
  const prefsLoaded = useRef(false)

  useEffect(() => {
    Promise.all([
      fetchJson<EurekaSet[]>('/api/eureka'),
      fetchJson<EurekaCategory[]>('/api/categories'),
      fetchJson<EurekaColor[]>('/api/colors'),
      fetchJson<Trial[]>('/api/trials'),
    ])
      .then(([sets, cats, cols, trls]) => {
        setEurekaSets(sets)
        setCategories(cats)
        setColors(cols)
        setTrials(trls)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load eureka data:', err)
        setIsError(true)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchJson<UserPreferences>('/api/preferences')
      .then((prefs) => {
        setGroupBySet(prefs.group_by_set)
        setShowByColor(prefs.show_by_color)
        setFilters({
          selectedEurekaSet: prefs.eureka_set_filter ?? null,
          selectedCategory: (prefs.eureka_category as CategoryFilter) ?? null,
          selectedObtainedFilter: (prefs.eureka_obtained_filter as ObtainedFilter) ?? null,
          selectedColor: prefs.eureka_color ?? null,
          selectedRarity: prefs.eureka_rarity ? Number(prefs.eureka_rarity) || null : null,
        })
        prefsLoaded.current = true
      })
      .catch(() => {
        prefsLoaded.current = true
      })
  }, [isLoggedIn])

  const handleGroupBySetChange = () => {
    const next = !groupBySet
    setGroupBySet(next)
    if (isLoggedIn) startTransition(() => updateGroupBySet(next))
  }

  const handleShowByColorChange = () => {
    const next = !showByColor
    setShowByColor(next)
    if (isLoggedIn) startTransition(() => updateShowByColor(next))
  }

  const handleFiltersChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const handleToggleObtained = async (eureka_set: string, category: string, color: string) => {
    const saved = obtainedEureka
    const isObtained = obtainedEureka.some(
      (o) => o.eureka_set === eureka_set && o.category === category && o.color === color
    )
    if (isObtained) {
      setObtainedEureka((prev) =>
        prev.filter(
          (o) => !(o.eureka_set === eureka_set && o.category === category && o.color === color)
        )
      )
    } else {
      setObtainedEureka((prev) => [...prev, { id: -1, eureka_set, category, color }])
    }
    try {
      await handleObtained(eureka_set, category, color)
    } catch (err) {
      console.error('Failed to toggle obtained eureka:', err)
      setObtainedEureka(saved)
    }
  }

  const handleBatchToggleObtained = async (
    variants: Array<{ eureka_set: string; category: string; color: string }>,
    targetObtained: boolean
  ) => {
    const saved = obtainedEureka
    const matches = (
      o: { eureka_set: string | null; category: string | null; color: string | null },
      v: { eureka_set: string; category: string; color: string }
    ) => o.eureka_set === v.eureka_set && o.category === v.category && o.color === v.color

    if (targetObtained) {
      setObtainedEureka((prev) => {
        const toAdd = variants
          .filter((v) => !prev.some((o) => matches(o, v)))
          .map((v) => ({ id: -1, ...v }))
        return [...prev, ...toAdd]
      })
    } else {
      setObtainedEureka((prev) => prev.filter((o) => !variants.some((v) => matches(o, v))))
    }

    for (const v of variants) {
      try {
        await handleObtained(v.eureka_set, v.category, v.color)
      } catch (err) {
        console.error('Failed to batch toggle obtained eureka:', err)
        setObtainedEureka(saved)
        return
      }
    }
  }

  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded.current) return
    startTransition(() =>
      updateEurekaFilters({
        eureka_set_filter: filters.selectedEurekaSet,
        eureka_category: filters.selectedCategory,
        eureka_obtained_filter: filters.selectedObtainedFilter,
        eureka_color: filters.selectedColor,
        eureka_rarity: filters.selectedRarity ? String(filters.selectedRarity) : null,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (!isLoggedIn) return

    fetchJson<ObtainedEureka[]>('/api/obtained-eureka')
      .then((data) => setObtainedEureka(data))
      .catch((err) => {
        console.error('Failed to load obtained eureka:', err)
        setIsObtainedError(true)
      })

    const obtainedChannel = supabase
      .channel(`obtained-filter-channel:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'obtained_eureka',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as ObtainedEureka
          setObtainedEureka((prev) => {
            const withoutPlaceholder = prev.filter(
              (o) =>
                !(
                  o.id === -1 &&
                  o.eureka_set === incoming.eureka_set &&
                  o.category === incoming.category &&
                  o.color === incoming.color
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
          table: 'obtained_eureka',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setObtainedEureka((prev) =>
            prev.filter((obtainedEureka) => obtainedEureka.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const eurekaSetsWithObtained = eurekaSets.map((set) =>
    updateEurekaSet({ eurekaSet: set, obtainedEureka })
  )

  return (
    <EurekaDataContext.Provider
      value={{
        eurekaSets: eurekaSetsWithObtained,
        obtainedEureka,
        categories,
        colors,
        trials,
        isLoggedIn,
        isAdmin,
        isLoading,
        isError,
        isObtainedError,
        userId,
        groupBySet,
        showByColor,
        onGroupBySetChange: handleGroupBySetChange,
        onShowByColorChange: handleShowByColorChange,
        filters,
        onFiltersChange: handleFiltersChange,
        onClearFilters: handleClearFilters,
        onToggleObtained: handleToggleObtained,
        onBatchToggleObtained: handleBatchToggleObtained,
      }}
    >
      {children}
    </EurekaDataContext.Provider>
  )
}
