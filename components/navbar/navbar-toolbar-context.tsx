'use client'

import * as React from 'react'
import { NAV_DRAWER_STORAGE_KEY, SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'

type NavDrawerContextType = {
  drawerOpen: boolean
  // The user's persisted open preference (from the cookie). Tracks only persisting
  // writes, so it survives an ephemeral auto-close (e.g. shrinking to xs closes the
  // live drawer with persist:false but leaves this preference intact) — the shell
  // reads it to restore the drawer when the viewport expands back to where it fits.
  drawerPreferOpen: boolean
  // persist defaults to true. The temporary mobile drawer passes { persist: false }
  // so opening the overlay never writes the cookie that seeds the permanent drawer.
  setDrawerOpen: (open: boolean, opts?: { persist?: boolean }) => void
}

type SidebarContextType = {
  sidebarOpen: boolean
  // The user's persisted sidebar open preference (from the cookie). Like the nav
  // drawer's, it tracks only persisting writes, so it survives an ephemeral auto-close
  // on shrink and lets the shell restore the sidebar when the viewport expands.
  sidebarPreferOpen: boolean
  // persist defaults to true: user toggles write the cookie. The shell's breakpoint
  // reconciliation passes { persist: false } to update state without touching the
  // saved preference.
  setSidebarOpen: (open: boolean, opts?: { persist?: boolean }) => void
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
  initialSidebarOpen = false,
}: {
  children: React.ReactNode
  initialDrawerOpen?: boolean
  initialSidebarOpen?: boolean
}) {
  const [drawerOpen, setDrawerOpenState] = React.useState(initialDrawerOpen)
  // The persisted preference, seeded from the same cookie-derived initial value.
  // Only persisting writes update it, so an auto-close (persist:false) doesn't erase it.
  const [drawerPreferOpen, setDrawerPreferOpen] = React.useState(initialDrawerOpen)
  const [sidebarOpen, setSidebarOpenState] = React.useState(initialSidebarOpen)
  // The persisted sidebar preference, mirroring drawerPreferOpen.
  const [sidebarPreferOpen, setSidebarPreferOpen] = React.useState(initialSidebarOpen)
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
      setDrawerPreferOpen(open)
      document.cookie = `${NAV_DRAWER_STORAGE_KEY}=${open}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])

  // Mirrors setDrawerOpen: user toggles persist (default), the shell's breakpoint
  // reconciliation passes { persist: false } to leave the saved preference untouched.
  const setSidebarOpen = React.useCallback((open: boolean, opts?: { persist?: boolean }) => {
    setSidebarOpenState(open)
    if (opts?.persist ?? true) {
      setSidebarPreferOpen(open)
      document.cookie = `${SIDEBAR_STORAGE_KEY}=${open}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, drawerPreferOpen, setDrawerOpen }}>
      <SidebarContext.Provider
        value={{
          sidebarOpen,
          sidebarPreferOpen,
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
