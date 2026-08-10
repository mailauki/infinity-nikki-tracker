'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { MakeupCategory, MakeupSet, ObtainedMakeup } from '@/lib/types/makeup'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { Style } from '@/lib/types/eureka'
import { handleObtainedMakeup } from '@/app/makeup/actions'
import {
  applyObtainedMakeupKeys,
  buildObtainedMakeupKeySet,
  STANDALONE_MAKEUP_SLUG,
} from '@/hooks/makeup'
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
  // Raw sets exactly as the API returned them — their variants carry no
  // `obtained` flag. The flags are derived below from `obtainedMakeup` so that
  // the initial DB load and every optimistic toggle share one code path.
  const [rawMakeupSets, setRawMakeupSets] = useState<MakeupSet[]>([])
  const [makeupCategories, setMakeupCategories] = useState<MakeupCategory[]>([])
  const [styles, setStyles] = useState<Style[]>([])
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
        setRawMakeupSets(payload.makeupSets ?? [])
        setMakeupCategories(payload.makeupCategories ?? [])
        setStyles(payload.styles ?? [])
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

  // `obtainedMakeup` is the single source of truth for collection state; the
  // per-variant `obtained` flag every card, count, and filter reads is derived
  // from it here rather than baked in by the API. This mirrors what
  // `getMakeupSets` does server-side for the detail page, and is what makes an
  // optimistic toggle actually repaint — mutating `obtainedMakeup` alone used
  // to leave `obtained` undefined on every variant.
  const makeupSets = useMemo(() => {
    if (!isLoggedIn) return rawMakeupSets
    const keys = buildObtainedMakeupKeySet(obtainedMakeup)
    // Evolutions carry their own variants, so both levels need the flags.
    return rawMakeupSets.map((set) => ({
      ...set,
      makeup_variants: applyObtainedMakeupKeys(set.makeup_variants, keys),
      evolutions: set.evolutions.map((evolution) => ({
        ...evolution,
        makeup_variants: applyObtainedMakeupKeys(evolution.makeup_variants, keys),
      })),
    }))
  }, [rawMakeupSets, obtainedMakeup, isLoggedIn])

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

  // Unconditionally flips `rows` into `targetObtained` state — used both for
  // the forward optimistic update (already pre-filtered to the genuinely
  // mutated subset by the caller) and for rollback (flipping that exact same
  // subset back). Never re-derives "did this actually change" itself, so it
  // has no dependency on a possibly-stale `obtainedMakeup` snapshot.
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

      // Compute the genuinely-mutated subset synchronously, against the
      // current `obtainedMakeup` value, before scheduling the state update.
      // This is what makes the rollback exact: a row already in the target
      // state (e.g. a mixed-state batch where only some rows need to flip)
      // is excluded here and therefore never rolled back either, even though
      // it appeared in the original `rows` request.
      const existing = new Set(obtainedMakeup.map((o) => o.makeup_variant))
      const mutated = targetObtained
        ? rows.filter((r) => !existing.has(r.makeup_variant))
        : rows.filter((r) => existing.has(r.makeup_variant))
      if (mutated.length === 0) return

      applyToggles(mutated, targetObtained)
      Promise.all(
        mutated.map((r) => handleObtainedMakeup(r.makeup_set, r.makeup_category, r.makeup_variant))
      ).catch((err) => {
        console.error('Failed to toggle obtained makeup:', err)
        // Roll back exactly the rows this call mutated — never the full
        // requested batch, which may include rows this call never touched.
        applyToggles(mutated, !targetObtained)
        setIsObtainedError(true)
        enqueueSnackbar('Could not save that change', { variant: 'error' })
      })
    },
    [applyToggles, isLoggedIn, obtainedMakeup]
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
