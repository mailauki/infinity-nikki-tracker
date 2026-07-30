'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { fetchPreferencesOnce } from '@/lib/preferences-cache'
import { savePreferences } from '@/lib/save-preferences'

export type SortOrder = 'new' | 'old'
export type SortAxis = 'date' | 'rarity' | 'progress' | 'title'
export type SortDir = 'asc' | 'desc'

// The persisted `sort_order` column predates the axis/direction split and stores
// the date direction as 'new'/'old'. We treat `sortDir` as the unified direction
// and map it to that legacy shape: desc = newest first ('new'), asc = oldest ('old').
const dirToOrder = (dir: SortDir): SortOrder => (dir === 'desc' ? 'new' : 'old')
const orderToDir = (order: SortOrder): SortDir => (order === 'new' ? 'desc' : 'asc')

interface SortContextValue {
  sortDir: SortDir
  toggleSortDir: () => void
  sortAxis: SortAxis
  setSortAxis: (axis: SortAxis) => void
  // Date-axis direction alias kept for the eureka/trials views and the settings
  // "Default Sort" toggle, which only ever sort by date.
  sortOrder: SortOrder
  toggleSort: () => void
  // Restore axis to 'date' and direction to the configured default. Used by the
  // filter menu "Reset".
  resetSort: () => void
  // Whether the current sort differs from its defaults (drives the Reset button).
  isSortDefault: boolean
}

export const SortContext = createContext<SortContextValue>({
  sortDir: 'desc',
  toggleSortDir: () => {},
  sortAxis: 'date',
  setSortAxis: () => {},
  sortOrder: 'new',
  toggleSort: () => {},
  resetSort: () => {},
  isSortDefault: true,
})

const SORT_AXES: SortAxis[] = ['date', 'rarity', 'progress', 'title']

// A failed sort-preference write must not disrupt the UI — the sort still
// applies for this session, it just may not survive a reload.
const persistFailed = (err: unknown) => {
  console.error('Failed to persist sort preference:', err)
}

export function SortProvider({
  children,
  isLoggedIn = false,
  defaultOrder = 'new',
}: {
  children: React.ReactNode
  isLoggedIn?: boolean
  defaultOrder?: SortOrder
}) {
  const [sortDir, setSortDir] = useState<SortDir>(orderToDir(defaultOrder))
  const [sortAxis, setSortAxisState] = useState<SortAxis>('date')

  // Hydrate from saved preferences for logged-in users.
  useEffect(() => {
    if (!isLoggedIn) return
    // The shared helper rejects on a non-ok response rather than resolving null,
    // and the .catch below swallows that — same silent no-op as before.
    fetchPreferencesOnce()
      .then((prefs: UserPreferences | null) => {
        if (!prefs) return
        // Back-compat: accept legacy 'new'/'old' as well as 'asc'/'desc'.
        const stored = prefs.sort_order
        if (stored === 'new' || stored === 'old') setSortDir(orderToDir(stored))
        else if (stored === 'asc' || stored === 'desc') setSortDir(stored)
        if (prefs.outfit_sort_axis && SORT_AXES.includes(prefs.outfit_sort_axis as SortAxis)) {
          setSortAxisState(prefs.outfit_sort_axis as SortAxis)
        }
      })
      .catch(() => {})
  }, [isLoggedIn])

  const toggleSortDir = () => {
    const next: SortDir = sortDir === 'desc' ? 'asc' : 'desc'
    setSortDir(next)
    if (isLoggedIn) void savePreferences({ sort_order: next }).catch(persistFailed)
  }

  const setSortAxis = (axis: SortAxis) => {
    setSortAxisState(axis)
    if (isLoggedIn) void savePreferences({ outfit_sort_axis: axis }).catch(persistFailed)
  }

  const defaultDir = orderToDir(defaultOrder)

  // Restore both axis and direction to their defaults, persisting for logged-in
  // users in one call. Both keys in one call: two concurrent upserts would race
  // on the same row.
  const resetSort = () => {
    setSortAxisState('date')
    setSortDir(defaultDir)
    if (isLoggedIn) {
      void savePreferences({ outfit_sort_axis: 'date', sort_order: defaultDir }).catch(
        persistFailed
      )
    }
  }

  const isSortDefault = sortAxis === 'date' && sortDir === defaultDir

  return (
    <SortContext.Provider
      value={{
        sortDir,
        toggleSortDir,
        sortAxis,
        setSortAxis,
        sortOrder: dirToOrder(sortDir),
        toggleSort: toggleSortDir,
        resetSort,
        isSortDefault,
      }}
    >
      {children}
    </SortContext.Provider>
  )
}

export function useSortOrder() {
  return useContext(SortContext)
}
