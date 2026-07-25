'use client'

import * as React from 'react'

export type TabValue = 'profile' | 'appearance' | 'account'

type SettingsTabsContextType = {
  tab: TabValue
  setTab: (tab: TabValue) => void
}

const SettingsTabsContext = React.createContext<SettingsTabsContextType | null>(null)

export function SettingsTabsProvider({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean
  children: React.ReactNode
}) {
  const [tab, setTab] = React.useState<TabValue>(isLoggedIn ? 'profile' : 'appearance')

  // Logged-out users only have the Appearance tab; normalize if auth changes.
  React.useEffect(() => {
    if (!isLoggedIn) setTab('appearance')
  }, [isLoggedIn])

  return (
    <SettingsTabsContext.Provider value={{ tab, setTab }}>{children}</SettingsTabsContext.Provider>
  )
}

export function useSettingsTabs() {
  const ctx = React.useContext(SettingsTabsContext)
  if (!ctx) throw new Error('useSettingsTabs must be used within SettingsTabsProvider')
  return ctx
}
