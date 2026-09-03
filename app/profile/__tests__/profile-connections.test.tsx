import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileConnections from '@/app/profile/profile-connections'
import ProfileStatsBar from '@/app/profile/profile-stats-bar'
import { ProfileTabsProvider, useProfileTabs } from '@/app/profile/profile-tabs-context'
import type { FollowProfile } from '@/lib/types/follows'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const searchResults = vi.fn(() =>
  Promise.resolve<{ data: FollowProfile[]; error: null }>({ data: [], error: null })
)

// The implementation calls .neq() only when viewerId is truthy, so the chain
// from .or() varies. A self-returning chainable builder handles both shapes.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    const builder: Record<string, unknown> = {}
    for (const method of ['from', 'select', 'or', 'neq', 'order']) {
      builder[method] = () => builder
    }
    builder.limit = () => searchResults()
    return builder
  },
}))

// StickyBar portals into a target supplied by the layout shell, which isn't
// mounted here. Render the toggle inline so the test can click it.
vi.mock('@/components/navbar/sticky-bar', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const ALICE = { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: null }
const BOB = { id: 'u2', username: 'bob', display_name: 'Bob', avatar_url: null }

// The sticky bar only renders the Connections toggle while that tab is active,
// which the toolbar normally sets. Flip it on mount so the test exercises the
// real context wiring rather than a hand-built provider value.
function SelectConnections() {
  const { setTab } = useProfileTabs()
  React.useEffect(() => setTab('connections'), [setTab])
  return null
}

function setup(props: Partial<React.ComponentProps<typeof ProfileConnections>> = {}) {
  return render(
    <ProfileTabsProvider>
      <SelectConnections />
      <ProfileStatsBar />
      <ProfileConnections
        followers={[BOB]}
        following={[ALICE]}
        viewerFollowingIds={new Set(['u1'])}
        viewerId="viewer"
        {...props}
      />
    </ProfileTabsProvider>
  )
}

describe('ProfileConnections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchResults.mockResolvedValue({ data: [], error: null })
  })

  it('shows the following list by default', () => {
    setup()
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.queryByText('@bob')).not.toBeInTheDocument()
  })

  it('swaps to followers when the sticky-bar toggle is used', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: 'Followers' }))

    expect(screen.getByText('@bob')).toBeInTheDocument()
    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
  })

  it('renders no tabs of its own — the sticky bar owns the switch', () => {
    setup()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('tells the user when a direction is empty', async () => {
    const user = userEvent.setup()
    setup({ followers: [] })

    await user.click(screen.getByRole('button', { name: 'Followers' }))

    expect(screen.getByText('No followers yet')).toBeInTheDocument()
  })

  it('searches profiles from the tab body', async () => {
    const user = userEvent.setup()
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    setup()

    await user.type(screen.getByLabelText('Search profiles'), 'bo')

    expect(await screen.findByText('@bob')).toBeInTheDocument()
  })
})
