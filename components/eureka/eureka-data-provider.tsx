'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import {
  Category,
  Color,
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

const supabase = createClient()

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
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [obtainedEureka, setObtainedEureka] = useState<ObtainedEureka[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState<boolean>(DEFAULT_PREFERENCES.group_by_set)
  const [showByColor, setShowByColor] = useState<boolean>(DEFAULT_PREFERENCES.show_by_color)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [, startTransition] = useTransition()
  const prefsLoaded = useRef(false)

  useEffect(() => {
    Promise.all([
      fetchJson<EurekaSet[]>('/api/eureka'),
      fetchJson<Category[]>('/api/categories'),
      fetchJson<Color[]>('/api/colors'),
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
          selectedRarities: prefs.eureka_rarity
            ? prefs.eureka_rarity.split(',').map(Number).filter(Boolean)
            : [],
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

  const handleToggleObtained = (eureka_set: string, category: string, color: string) => {
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
    handleObtained(eureka_set, category, color)
  }

  useEffect(() => {
    if (!isLoggedIn || !prefsLoaded.current) return
    startTransition(() =>
      updateEurekaFilters({
        eureka_set_filter: filters.selectedEurekaSet,
        eureka_category: filters.selectedCategory,
        eureka_obtained_filter: filters.selectedObtainedFilter,
        eureka_color: filters.selectedColor,
        eureka_rarity: filters.selectedRarities.length ? filters.selectedRarities.join(',') : null,
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
          setObtainedEureka((prev) => [...prev, payload.new as ObtainedEureka])
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
      }}
    >
      {children}
    </EurekaDataContext.Provider>
  )
}
