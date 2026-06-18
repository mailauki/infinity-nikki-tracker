'use client'

import * as React from 'react'

type NavBarToolbarContextType = {
  toolbarSlot: HTMLDivElement | null
  setToolbarSlot: (el: HTMLDivElement | null) => void
}

type NavDrawerContextType = {
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

type FilterDrawerContextType = {
  filterOpen: boolean
  setFilterOpen: (open: boolean) => void
}

export const NavBarToolbarContext = React.createContext<NavBarToolbarContextType | null>(null)
export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)
export const FilterDrawerContext = React.createContext<FilterDrawerContextType | null>(null)

const DRAWER_STORAGE_KEY = 'nav-drawer-open'
const FILTER_STORAGE_KEY = 'filter-drawer-open'

export function NavBarToolbarProvider({ children }: { children: React.ReactNode }) {
  const [toolbarSlot, setToolbarSlot] = React.useState<HTMLDivElement | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [filterOpen, setFilterOpen] = React.useState(false)

  // Read persisted state after mount to avoid an SSR/client hydration mismatch.
  React.useEffect(() => {
    setDrawerOpen(localStorage.getItem(DRAWER_STORAGE_KEY) === 'true')
    setFilterOpen(localStorage.getItem(FILTER_STORAGE_KEY) === 'true')
  }, [])

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <FilterDrawerContext.Provider value={{ filterOpen, setFilterOpen }}>
        <NavBarToolbarContext.Provider value={{ toolbarSlot, setToolbarSlot }}>
          {children}
        </NavBarToolbarContext.Provider>
      </FilterDrawerContext.Provider>
    </NavDrawerContext.Provider>
  )
}

export function useNavBarToolbar() {
  const ctx = React.useContext(NavBarToolbarContext)
  if (!ctx) throw new Error('useNavBarToolbar must be used within NavBarToolbarProvider')
  return ctx
}

export function useNavDrawer() {
  const ctx = React.useContext(NavDrawerContext)
  if (!ctx) throw new Error('useNavDrawer must be used within NavBarToolbarProvider')
  return ctx
}

export function useFilterDrawer() {
  const ctx = React.useContext(FilterDrawerContext)
  if (!ctx) throw new Error('useFilterDrawer must be used within NavBarToolbarProvider')
  return ctx
}
