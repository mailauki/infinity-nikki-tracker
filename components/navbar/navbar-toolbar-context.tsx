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

export const NavBarToolbarContext = React.createContext<NavBarToolbarContextType | null>(null)
export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)

const DRAWER_STORAGE_KEY = 'nav-drawer-open'

export function NavBarToolbarProvider({ children }: { children: React.ReactNode }) {
  const [toolbarSlot, setToolbarSlot] = React.useState<HTMLDivElement | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(
    () => typeof window !== 'undefined' && localStorage.getItem(DRAWER_STORAGE_KEY) === 'true'
  )

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <NavBarToolbarContext.Provider value={{ toolbarSlot, setToolbarSlot }}>
        {children}
      </NavBarToolbarContext.Provider>
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
