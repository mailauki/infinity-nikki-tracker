'use client'

import * as React from 'react'

type NavBarToolbarContextType = {
  toolbarContent: React.ReactNode
  setToolbarContent: (content: React.ReactNode) => void
}

export const NavBarToolbarContext = React.createContext<NavBarToolbarContextType | null>(null)

export function NavBarToolbarProvider({ children }: { children: React.ReactNode }) {
  const [toolbarContent, setToolbarContent] = React.useState<React.ReactNode>(null)

  return (
    <NavBarToolbarContext.Provider value={{ toolbarContent, setToolbarContent }}>
      {children}
    </NavBarToolbarContext.Provider>
  )
}

export function useNavBarToolbar() {
  const ctx = React.useContext(NavBarToolbarContext)
  if (!ctx) throw new Error('useNavBarToolbar must be used within NavBarToolbarProvider')
  return ctx
}
