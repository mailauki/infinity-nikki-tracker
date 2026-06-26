'use client'

import { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { updateSortDir, updateSortAxis } from '@/app/actions/preferences'

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
  const [, startTransition] = useTransition()

  // Hydrate from saved preferences for logged-in users.
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/preferences')
      .then((r) => (r.ok ? (r.json() as Promise<UserPreferences>) : null))
      .then((prefs) => {
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
    if (isLoggedIn) startTransition(() => updateSortDir(next))
  }

  const setSortAxis = (axis: SortAxis) => {
    setSortAxisState(axis)
    if (isLoggedIn) startTransition(() => updateSortAxis(axis))
  }

  const defaultDir = orderToDir(defaultOrder)

  // Restore both axis and direction to their defaults, persisting for logged-in
  // users in one transition.
  const resetSort = () => {
    setSortAxisState('date')
    setSortDir(defaultDir)
    if (isLoggedIn) {
      startTransition(() => {
        updateSortAxis('date')
        updateSortDir(defaultDir)
      })
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
