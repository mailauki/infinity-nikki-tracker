'use client'

import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import StickyBar from '@/components/navbar/sticky-bar'
import { useProfileTabs, type StatsView } from './profile-tabs-context'

// The Outfit/Eureka switch for the Stats tab, pinned in the sticky bar beneath
// the AppBar. Renders nothing on the Profile tab — there is nothing to toggle.
export default function ProfileStatsBar() {
  const { tab, statsView, setStatsView } = useProfileTabs()

  if (tab !== 'stats') return null

  return (
    <StickyBar>
      <ToggleButtonGroup
        exclusive
        aria-label="Collection stats view"
        color="primary"
        size="small"
        value={statsView}
        onChange={(_, next: StatsView | null) => {
          if (next) setStatsView(next)
        }}
      >
        <ToggleButton sx={{ backdropFilter: 'blur(8px)' }} value="outfits">
          Outfit Stats
        </ToggleButton>
        <ToggleButton sx={{ backdropFilter: 'blur(8px)' }} value="eureka">
          Eureka Stats
        </ToggleButton>
      </ToggleButtonGroup>
    </StickyBar>
  )
}
