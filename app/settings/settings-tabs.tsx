'use client'

import { type User } from '@supabase/supabase-js'
import { SettingsTabsProvider } from './settings-tabs-context'
import SettingsTabsBar from './settings-tabs-bar'
import SettingsTabsContent from './settings-tabs-content'

export default function SettingsTabs({
  isLoggedIn,
  isAdmin,
  isPremium,
  user,
}: {
  isLoggedIn: boolean
  isAdmin: boolean
  isPremium: boolean
  user: User | null
}) {
  return (
    <SettingsTabsProvider isLoggedIn={isLoggedIn}>
      <SettingsTabsBar isLoggedIn={isLoggedIn} />
      <SettingsTabsContent
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        isPremium={isPremium}
        user={user}
      />
    </SettingsTabsProvider>
  )
}
