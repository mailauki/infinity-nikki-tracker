'use client'

import { Tab, Tabs } from '@mui/material'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { useSettingsTabs, type TabValue } from './settings-tabs-context'

export default function SettingsTabsBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { tab, setTab } = useSettingsTabs()

  return (
    <ToolbarSlot
      lead={
        <Tabs
          aria-label="Settings tabs"
          sx={{ flexGrow: 1 }}
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
      }
    />
  )
}
