'use client'

import { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { updateSortOrder } from '@/app/actions/preferences'

export type SortOrder = 'new' | 'old'

interface SortContextValue {
  sortOrder: SortOrder
  toggleSort: () => void
}

export const SortContext = createContext<SortContextValue>({
  sortOrder: 'new',
  toggleSort: () => {},
})

export function SortProvider({
  children,
  isLoggedIn = false,
  defaultOrder = 'new',
}: {
  children: React.ReactNode
  isLoggedIn?: boolean
  defaultOrder?: SortOrder
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder)
  const [, startTransition] = useTransition()

  // Hydrate from the saved preference for logged-in users.
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/preferences')
      .then((r) => (r.ok ? (r.json() as Promise<UserPreferences>) : null))
      .then((prefs) => {
        if (prefs?.sort_order) setSortOrder(prefs.sort_order as SortOrder)
      })
      .catch(() => {})
  }, [isLoggedIn])

  const toggleSort = () =>
    setSortOrder((prev) => {
      const next = prev === 'new' ? 'old' : 'new'
      if (isLoggedIn) startTransition(() => updateSortOrder(next))
      return next
    })

  return <SortContext.Provider value={{ sortOrder, toggleSort }}>{children}</SortContext.Provider>
}

export function useSortOrder() {
  return useContext(SortContext)
}
