'use client'

import * as React from 'react'

export type ProfileTabValue = 'profile' | 'stats' | 'connections'
export type StatsView = 'outfits' | 'eureka' | 'makeup' | 'cloaks'
export type ConnectionsView = 'following' | 'followers'

type ProfileTabsContextType = {
  tab: ProfileTabValue
  setTab: (tab: ProfileTabValue) => void
  // Which collection the Stats tab is showing. Lives here rather than inside the
  // stats view because the toggle renders in the sticky bar — a separate portal
  // from the content it controls.
  statsView: StatsView
  setStatsView: (view: StatsView) => void
  // Which direction the Connections tab is showing. Here for the same reason as
  // statsView — its toggle renders in the sticky bar, a separate portal from the
  // content it controls.
  connectionsView: ConnectionsView
  setConnectionsView: (view: ConnectionsView) => void
}

const ProfileTabsContext = React.createContext<ProfileTabsContextType | null>(null)

export function ProfileTabsProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = React.useState<ProfileTabValue>('profile')
  const [statsView, setStatsView] = React.useState<StatsView>('outfits')
  const [connectionsView, setConnectionsView] = React.useState<ConnectionsView>('following')

  return (
    <ProfileTabsContext.Provider
      value={{ tab, setTab, statsView, setStatsView, connectionsView, setConnectionsView }}
    >
      {children}
    </ProfileTabsContext.Provider>
  )
}

export function useProfileTabs() {
  const ctx = React.useContext(ProfileTabsContext)
  if (!ctx) throw new Error('useProfileTabs must be used within ProfileTabsProvider')
  return ctx
}
