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

type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const NavBarToolbarContext = React.createContext<NavBarToolbarContextType | null>(null)
export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)
export const SidebarContext = React.createContext<SidebarContextType | null>(null)

const DRAWER_STORAGE_KEY = 'nav-drawer-open'
const SIDEBAR_STORAGE_KEY = 'sidebar-open'

export function NavBarToolbarProvider({ children }: { children: React.ReactNode }) {
  const [toolbarSlot, setToolbarSlot] = React.useState<HTMLDivElement | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Read persisted state after mount to avoid an SSR/client hydration mismatch.
  React.useEffect(() => {
    setDrawerOpen(localStorage.getItem(DRAWER_STORAGE_KEY) === 'true')
    setSidebarOpen(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
  }, [])

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
        <NavBarToolbarContext.Provider value={{ toolbarSlot, setToolbarSlot }}>
          {children}
        </NavBarToolbarContext.Provider>
      </SidebarContext.Provider>
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

export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within NavBarToolbarProvider')
  return ctx
}
