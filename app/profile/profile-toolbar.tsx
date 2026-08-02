'use client'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { AdminPanelSettings, Edit } from '@mui/icons-material'
import { IconButton, Tab, Tabs, Tooltip } from '@mui/material'
import Link from 'next/link'
import { useProfileTabs, type ProfileTabValue } from './profile-tabs-context'

export default function ProfileToolbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const { tab, setTab } = useProfileTabs()

  return (
    <ToolbarSlot
      lead={
        <Tabs
          aria-label="Profile tabs"
          value={tab}
          onChange={(_, value: ProfileTabValue) => setTab(value)}
        >
          <Tab label="Profile" value="profile" />
          <Tab label="Stats" value="stats" />
        </Tabs>
      }
    >
      {isAdmin && (
        <Tooltip title="Admin access">
          <IconButton component={Link} href="/admin">
            <AdminPanelSettings />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Edit profile">
        <IconButton component={Link} href="/settings">
          <Edit />
        </IconButton>
      </Tooltip>
    </ToolbarSlot>
  )
}
