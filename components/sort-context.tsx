'use client'

import { createContext, useContext, useState } from 'react'

type SortOrder = 'new' | 'old'

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
  defaultOrder = 'new',
}: {
  children: React.ReactNode
  defaultOrder?: SortOrder
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder)
  const toggleSort = () => setSortOrder((prev) => (prev === 'new' ? 'old' : 'new'))
  return <SortContext.Provider value={{ sortOrder, toggleSort }}>{children}</SortContext.Provider>
}

export function useSortOrder() {
  return useContext(SortContext)
}
