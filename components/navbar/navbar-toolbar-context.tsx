'use client'

import * as React from 'react'
import { NAV_DRAWER_STORAGE_KEY, SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'

type NavDrawerContextType = {
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)
export const SidebarContext = React.createContext<SidebarContextType | null>(null)

export function DrawerStateProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Read persisted state after mount to avoid an SSR/client hydration mismatch.
  React.useEffect(() => {
    setDrawerOpen(localStorage.getItem(NAV_DRAWER_STORAGE_KEY) === 'true')
    setSidebarOpen(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
  }, [])

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
        {children}
      </SidebarContext.Provider>
    </NavDrawerContext.Provider>
  )
}

export function useNavDrawer() {
  const ctx = React.useContext(NavDrawerContext)
  if (!ctx) throw new Error('useNavDrawer must be used within DrawerStateProvider')
  return ctx
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within DrawerStateProvider')
  return ctx
}
