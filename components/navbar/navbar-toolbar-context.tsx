'use client'

import * as React from 'react'
import { NAV_DRAWER_STORAGE_KEY } from '@/lib/layout-constants'

type NavDrawerContextType = {
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  portalTarget: HTMLElement | null
  setPortalTarget: (el: HTMLElement | null) => void
  hasBody: boolean
  registerBody: () => void
  unregisterBody: () => void
}

export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)
export const SidebarContext = React.createContext<SidebarContextType | null>(null)

export function DrawerStateProvider({
  children,
  initialDrawerOpen = false,
}: {
  children: React.ReactNode
  // Seeded server-side from the persisted cookie so the content-pushing desktop
  // drawer renders at its correct width on first paint — no post-hydration widen
  // (the previous localStorage-in-effect approach caused a large CLS shift).
  initialDrawerOpen?: boolean
}) {
  const [drawerOpen, setDrawerOpenState] = React.useState(initialDrawerOpen)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
  const [bodyCount, setBodyCount] = React.useState(0)
  const registerBody = React.useCallback(() => setBodyCount((n) => n + 1), [])
  const unregisterBody = React.useCallback(() => setBodyCount((n) => Math.max(0, n - 1)), [])
  const hasBody = bodyCount > 0

  // Persist to a cookie (readable server-side next load) so the drawer's initial
  // width is correct before hydration. 1-year max-age, lax same-site.
  const setDrawerOpen = React.useCallback((open: boolean) => {
    setDrawerOpenState(open)
    document.cookie = `${NAV_DRAWER_STORAGE_KEY}=${open}; path=/; max-age=31536000; samesite=lax`
  }, [])

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <SidebarContext.Provider
        value={{
          sidebarOpen,
          setSidebarOpen,
          portalTarget,
          setPortalTarget,
          hasBody,
          registerBody,
          unregisterBody,
        }}
      >
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
