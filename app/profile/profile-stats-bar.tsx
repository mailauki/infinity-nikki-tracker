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
        {/* Four views no longer fit the "<Domain> Stats" phrasing on a narrow
            screen, so the labels are bare domain names — the group's aria-label
            already says these are stats views. */}
        <ToggleButton sx={{ backdropFilter: 'blur(8px)' }} value="outfits">
          Outfits
        </ToggleButton>
        <ToggleButton sx={{ backdropFilter: 'blur(8px)' }} value="eureka">
          Eureka
        </ToggleButton>
        <ToggleButton sx={{ backdropFilter: 'blur(8px)' }} value="makeup">
          Makeup
        </ToggleButton>
        <ToggleButton sx={{ backdropFilter: 'blur(8px)' }} value="cloaks">
          Cloaks
        </ToggleButton>
      </ToggleButtonGroup>
    </StickyBar>
  )
}
