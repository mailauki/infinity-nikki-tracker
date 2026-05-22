'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, Color, EurekaSet, ObtainedEureka, Trial, UserPreferences } from '@/lib/types/eureka'
import { updateGroupBySet, updateShowByColor } from '@/app/actions/preferences'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'
import { applyFilterParams } from '@/lib/filter-params'

import { EurekaDataContext } from './eureka-context'

const supabase = createClient()

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

export default function EurekaDataProvider({
  isLoggedIn,
  userId,
  children,
}: {
  isLoggedIn: boolean
  userId: string | null
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

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
  const [prefsRestored, setPrefsRestored] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    Promise.all([
      fetchJson<EurekaSet[]>('/api/eureka'),
      fetchJson<Category[]>('/api/categories'),
      fetchJson<Color[]>('/api/colors'),
      fetchJson<Trial[]>('/api/trials'),
    ])
      .then(([sets, categories, colors, trials]) => {
        setEurekaSets(sets)
        setCategories(categories)
        setColors(colors)
        setTrials(trials)
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

        const FILTER_KEYS = ['set', 'category', 'filter', 'color', 'rarity']
        const hasAnyFilterParam = FILTER_KEYS.some((k) => searchParams.has(k))
        if (!hasAnyFilterParam) {
          const updates: Record<string, string | null> = {
            set: prefs.eureka_set_filter ?? null,
            category: prefs.eureka_category ?? null,
            filter: prefs.eureka_obtained_filter ?? null,
            color: prefs.eureka_color ?? null,
            rarity: prefs.eureka_rarity ?? null,
          }
          const hasAnySavedFilter = Object.values(updates).some((v) => v !== null)
          if (hasAnySavedFilter) {
            router.replace(applyFilterParams(pathname, searchParams, updates), { scroll: false })
          }
        }
        setPrefsRestored(true)
      })
      .catch(() => setPrefsRestored(true))
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!isLoggedIn) return

    fetchJson<ObtainedEureka[]>('/api/obtained-eureka')
      .then((data) => setObtainedEureka(data))
      .catch((err) => {
        console.error('Failed to load obtained eureka:', err)
        setIsObtainedError(true)
      })

    const obtainedChannel = supabase
      .channel('obtained-filter-channel')
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
        isLoading,
        isError,
        isObtainedError,
        userId,
        groupBySet,
        showByColor,
        onGroupBySetChange: handleGroupBySetChange,
        onShowByColorChange: handleShowByColorChange,
      }}
    >
      {children}
    </EurekaDataContext.Provider>
  )
}
