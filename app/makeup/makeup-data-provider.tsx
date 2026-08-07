'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { MakeupCategory, MakeupSet, ObtainedMakeup } from '@/lib/types/makeup'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { handleObtainedMakeup } from '@/app/makeup/actions'
import { STANDALONE_MAKEUP_SLUG } from '@/hooks/makeup'
import {
  DEFAULT_MAKEUP_FILTERS,
  MakeupDataContext,
  MakeupFilterState,
} from '@/components/makeup/makeup-context'

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

type MakeupPayload = {
  makeupSets: MakeupSet[]
  makeupCategories: MakeupCategory[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  obtainedMakeup?: ObtainedMakeup[]
}

export default function MakeupDataProvider({
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
  const [makeupSets, setMakeupSets] = useState<MakeupSet[]>([])
  const [makeupCategories, setMakeupCategories] = useState<MakeupCategory[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonCategories, setSeasonCategories] = useState<SeasonCategory[]>([])
  const [obtainedMakeup, setObtainedMakeup] = useState<ObtainedMakeup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState(true)
  const [filters, setFilters] = useState<MakeupFilterState>(DEFAULT_MAKEUP_FILTERS)
  const [isFiltering, startFilterTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    fetchJson<MakeupPayload>('/api/makeup')
      .then((payload) => {
        if (cancelled) return
        setMakeupSets(payload.makeupSets ?? [])
        setMakeupCategories(payload.makeupCategories ?? [])
        setStyles(payload.styles ?? [])
        setLabels(payload.labels ?? [])
        setSeasons(payload.seasons ?? [])
        setSeasonCategories(payload.seasonCategories ?? [])
        setObtainedMakeup(payload.obtainedMakeup ?? [])
        setIsError(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load makeup data:', err)
        setIsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onFiltersChange = useCallback((updates: Partial<MakeupFilterState>) => {
    // Filter axes are session-only by design — no preference write here.
    startFilterTransition(() => {
      setFilters((prev) => ({ ...prev, ...updates }))
    })
  }, [])

  const onClearFilters = useCallback(() => {
    startFilterTransition(() => setFilters(DEFAULT_MAKEUP_FILTERS))
  }, [])

  const onGroupBySetChange = useCallback(() => setGroupBySet((prev) => !prev), [])

  // Optimistic: flip local state first, roll back the same rows on failure.
  const applyToggles = useCallback(
    (
      rows: Array<{ makeup_set: string; makeup_category: string; makeup_variant: string }>,
      targetObtained: boolean
    ) => {
      setObtainedMakeup((prev) => {
        const slugs = new Set(rows.map((r) => r.makeup_variant))
        if (!targetObtained) return prev.filter((o) => !slugs.has(o.makeup_variant))
        const existing = new Set(prev.map((o) => o.makeup_variant))
        const added = rows
          .filter((r) => !existing.has(r.makeup_variant))
          .map((r, i) => ({ id: -1 - i, ...r }) as ObtainedMakeup)
        return [...prev, ...added]
      })
    },
    []
  )

  const onBatchToggleObtained = useCallback(
    (
      rows: Array<{ makeup_set: string; makeup_category: string; makeup_variant: string }>,
      targetObtained: boolean
    ) => {
      if (!isLoggedIn || rows.length === 0) return
      applyToggles(rows, targetObtained)
      Promise.all(
        rows.map((r) => handleObtainedMakeup(r.makeup_set, r.makeup_category, r.makeup_variant))
      ).catch((err) => {
        console.error('Failed to toggle obtained makeup:', err)
        applyToggles(rows, !targetObtained)
        setIsObtainedError(true)
        enqueueSnackbar('Could not save that change', { variant: 'error' })
      })
    },
    [applyToggles, isLoggedIn]
  )

  const onToggleObtained = useCallback(
    (makeup_set: string, makeup_category: string, makeup_variant: string) => {
      const isObtained = obtainedMakeup.some((o) => o.makeup_variant === makeup_variant)
      onBatchToggleObtained(
        // A standalone piece has makeup_set null; send the bucket slug so the
        // insert has a non-null value. The RPC deletes by variant alone.
        [{ makeup_set: makeup_set || STANDALONE_MAKEUP_SLUG, makeup_category, makeup_variant }],
        !isObtained
      )
    },
    [obtainedMakeup, onBatchToggleObtained]
  )

  const value = useMemo(
    () => ({
      makeupSets,
      obtainedMakeup,
      makeupCategories,
      styles,
      labels,
      seasons,
      seasonCategories,
      isLoggedIn,
      isAdmin,
      isLoading,
      isError,
      isObtainedError,
      isFiltering,
      userId,
      groupBySet,
      onGroupBySetChange,
      filters,
      onFiltersChange,
      onClearFilters,
      onToggleObtained,
      onBatchToggleObtained,
    }),
    [
      makeupSets,
      obtainedMakeup,
      makeupCategories,
      styles,
      labels,
      seasons,
      seasonCategories,
      isLoggedIn,
      isAdmin,
      isLoading,
      isError,
      isObtainedError,
      isFiltering,
      userId,
      groupBySet,
      onGroupBySetChange,
      filters,
      onFiltersChange,
      onClearFilters,
      onToggleObtained,
      onBatchToggleObtained,
    ]
  )

  return <MakeupDataContext.Provider value={value}>{children}</MakeupDataContext.Provider>
}
