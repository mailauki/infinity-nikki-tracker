'use client'

import { useEffect, useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { type User } from '@supabase/supabase-js'
import LoginAlert from '@/components/login-alert'
import AppearanceSettings from './appearance-settings'
import AccountSettings from './account-settings'
import ProfileSettings from './profile-settings'

type TabValue = 'profile' | 'appearance' | 'account'

export default function SettingsTabs({
  isLoggedIn,
  user,
}: {
  isLoggedIn: boolean
  user: User | null
}) {
  const [tab, setTab] = useState<TabValue>(isLoggedIn ? 'profile' : 'appearance')

  useEffect(() => {
    if (!isLoggedIn) setTab('appearance')
  }, [isLoggedIn])

  return (
    <Box>
      <Tabs
        aria-label="Settings tabs"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        value={tab}
        onChange={(_, value: TabValue) => setTab(value)}
      >
        {isLoggedIn && <Tab label="Profile" value="profile" />}
        <Tab label="Appearance" value="appearance" />
        {isLoggedIn && <Tab label="Account" value="account" />}
      </Tabs>

      {tab === 'profile' && (isLoggedIn ? <ProfileSettings user={user} /> : <LoginAlert />)}
      {tab === 'appearance' && <AppearanceSettings />}
      {tab === 'account' && (isLoggedIn ? <AccountSettings /> : <LoginAlert />)}
    </Box>
  )
}
