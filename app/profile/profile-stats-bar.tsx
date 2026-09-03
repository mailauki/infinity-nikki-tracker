'use client'

import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import StickyBar from '@/components/navbar/sticky-bar'
import { useProfileTabs, type ConnectionsView, type StatsView } from './profile-tabs-context'

// The bar sits over scrolling content, so every button in it blurs what's behind.
const TOGGLE_SX = { backdropFilter: 'blur(8px)' }

// The sticky sub-toolbar beneath the AppBar. Two tabs put a switch here — Stats
// picks a collection, Connections picks a direction — so this component owns
// both and renders whichever the active tab calls for. The Profile tab has
// nothing to toggle, so it gets no bar at all (LayoutShell keys its spacing off
// hasStickyBar, which StickyBar only registers when it renders).
export default function ProfileStatsBar() {
  const { tab, statsView, setStatsView, connectionsView, setConnectionsView } = useProfileTabs()

  if (tab === 'connections') {
    return (
      <StickyBar>
        <ToggleButtonGroup
          exclusive
          aria-label="Connections view"
          color="primary"
          size="small"
          value={connectionsView}
          onChange={(_, next: ConnectionsView | null) => {
            if (next) setConnectionsView(next)
          }}
        >
          <ToggleButton sx={TOGGLE_SX} value="following">
            Following
          </ToggleButton>
          <ToggleButton sx={TOGGLE_SX} value="followers">
            Followers
          </ToggleButton>
        </ToggleButtonGroup>
      </StickyBar>
    )
  }

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
        <ToggleButton sx={TOGGLE_SX} value="outfits">
          Outfits
        </ToggleButton>
        <ToggleButton sx={TOGGLE_SX} value="eureka">
          Eureka
        </ToggleButton>
        <ToggleButton sx={TOGGLE_SX} value="makeup">
          Makeup
        </ToggleButton>
        <ToggleButton sx={TOGGLE_SX} value="cloaks">
          Cloaks
        </ToggleButton>
      </ToggleButtonGroup>
    </StickyBar>
  )
}
