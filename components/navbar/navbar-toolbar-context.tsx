'use client'

import * as React from 'react'

type NavBarToolbarContextType = {
  toolbarSlot: HTMLDivElement | null
  setToolbarSlot: (el: HTMLDivElement | null) => void
}

export const NavBarToolbarContext = React.createContext<NavBarToolbarContextType | null>(null)

export function NavBarToolbarProvider({ children }: { children: React.ReactNode }) {
  const [toolbarSlot, setToolbarSlot] = React.useState<HTMLDivElement | null>(null)

  return (
    <NavBarToolbarContext.Provider value={{ toolbarSlot, setToolbarSlot }}>
      {children}
    </NavBarToolbarContext.Provider>
  )
}

export function useNavBarToolbar() {
  const ctx = React.useContext(NavBarToolbarContext)
  if (!ctx) throw new Error('useNavBarToolbar must be used within NavBarToolbarProvider')
  return ctx
}
