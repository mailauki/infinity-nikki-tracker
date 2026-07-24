'use client'

import * as React from 'react'
import { NAV_DRAWER_STORAGE_KEY } from '@/lib/layout-constants'

type NavDrawerContextType = {
  drawerOpen: boolean
  // persist defaults to true. The temporary mobile drawer passes { persist: false }
  // so opening the overlay never writes the cookie that seeds the permanent drawer.
  setDrawerOpen: (open: boolean, opts?: { persist?: boolean }) => void
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

type ToolbarContextType = {
  toolbarTarget: HTMLElement | null
  setToolbarTarget: (el: HTMLElement | null) => void
  hasToolbar: boolean
  registerToolbar: () => void
  unregisterToolbar: () => void
}

export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)
export const SidebarContext = React.createContext<SidebarContextType | null>(null)
export const ToolbarContext = React.createContext<ToolbarContextType | null>(null)

export function DrawerStateProvider({
  children,
  initialDrawerOpen = false,
}: {
  children: React.ReactNode
  initialDrawerOpen?: boolean
}) {
  const [drawerOpen, setDrawerOpenState] = React.useState(initialDrawerOpen)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
  const [bodyCount, setBodyCount] = React.useState(0)
  const registerBody = React.useCallback(() => setBodyCount((n) => n + 1), [])
  const unregisterBody = React.useCallback(() => setBodyCount((n) => Math.max(0, n - 1)), [])
  const hasBody = bodyCount > 0

  const [toolbarTarget, setToolbarTarget] = React.useState<HTMLElement | null>(null)
  const [toolbarCount, setToolbarCount] = React.useState(0)
  const registerToolbar = React.useCallback(() => setToolbarCount((n) => n + 1), [])
  const unregisterToolbar = React.useCallback(() => setToolbarCount((n) => Math.max(0, n - 1)), [])
  const hasToolbar = toolbarCount > 0

  // persist defaults to true: the permanent drawer's toggle writes the cookie so the
  // server can seed the drawer's width next load (avoids CLS). The temporary mobile
  // drawer passes { persist: false } to update state only.
  const setDrawerOpen = React.useCallback((open: boolean, opts?: { persist?: boolean }) => {
    setDrawerOpenState(open)
    if (opts?.persist ?? true) {
      document.cookie = `${NAV_DRAWER_STORAGE_KEY}=${open}; path=/; max-age=31536000; samesite=lax`
    }
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
        <ToolbarContext.Provider
          value={{
            toolbarTarget,
            setToolbarTarget,
            hasToolbar,
            registerToolbar,
            unregisterToolbar,
          }}
        >
          {children}
        </ToolbarContext.Provider>
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

export function useToolbar() {
  const ctx = React.useContext(ToolbarContext)
  if (!ctx) throw new Error('useToolbar must be used within DrawerStateProvider')
  return ctx
}
