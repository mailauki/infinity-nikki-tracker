'use client'

import { type User } from '@supabase/supabase-js'
import LoginAlert from '@/components/login-alert'
import AppearanceSettings from './appearance-settings'
import AccountSettings from './account-settings'
import ProfileSettings from './profile-settings'
import { useSettingsTabs } from './settings-tabs-context'

export default function SettingsTabsContent({
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
  const { tab } = useSettingsTabs()

  return (
    <>
      {tab === 'profile' && (isLoggedIn ? <ProfileSettings user={user} /> : <LoginAlert />)}
      {tab === 'appearance' && <AppearanceSettings isLoggedIn={isLoggedIn} isPremium={isPremium} />}
      {tab === 'account' && (isLoggedIn ? <AccountSettings isAdmin={isAdmin} /> : <LoginAlert />)}
    </>
  )
}
