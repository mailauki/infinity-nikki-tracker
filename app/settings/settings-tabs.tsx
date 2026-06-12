'use client'

import { useEffect, useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { type User } from '@supabase/supabase-js'
import LoginAlert from '@/components/login-alert'
import AppearanceSettings from './appearance-settings'
import AccountSettings from './account-settings'
import ProfileSettings from './profile-settings'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'

type TabValue = 'profile' | 'appearance' | 'account'

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
  const [tab, setTab] = useState<TabValue>(isLoggedIn ? 'profile' : 'appearance')

  useEffect(() => {
    if (!isLoggedIn) setTab('appearance')
  }, [isLoggedIn])

  return (
    <>
      <NavBarToolbar>
        <Tabs
          aria-label="Settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}
          value={tab}
          onChange={(_, value: TabValue) => setTab(value)}
        >
          {isLoggedIn && (
            <Tab label="Profile" sx={{ flexGrow: { xs: 1, md: 0 } }} value="profile" />
          )}
          <Tab label="Appearance" sx={{ flexGrow: { xs: 1, md: 0 } }} value="appearance" />
          {isLoggedIn && (
            <Tab label="Account" sx={{ flexGrow: { xs: 1, md: 0 } }} value="account" />
          )}
        </Tabs>
      </NavBarToolbar>

      {tab === 'profile' && (isLoggedIn ? <ProfileSettings user={user} /> : <LoginAlert />)}
      {tab === 'appearance' && <AppearanceSettings isLoggedIn={isLoggedIn} isPremium={isPremium} />}
      {tab === 'account' && (isLoggedIn ? <AccountSettings isAdmin={isAdmin} /> : <LoginAlert />)}
    </>
  )
}
