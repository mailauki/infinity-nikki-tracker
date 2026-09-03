import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProfileCard from '@/app/profile/profile-card'
import ProfileTabs from '@/app/profile/profile-tabs'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

// ToolbarSlot and StickyBar portal into targets supplied by the layout shell,
// which isn't mounted here. Render inline so the tabs and toggle are reachable.
vi.mock('@/components/navbar/toolbar-slot', () => ({
  default: ({ lead, children }: { lead?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      {lead}
      {children}
    </div>
  ),
}))

vi.mock('@/components/navbar/sticky-bar', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function cardProps(overrides: Partial<React.ComponentProps<typeof ProfileCard>> = {}) {
  return {
    avatar_url: null,
    displayName: 'Alpha',
    followingCount: 12,
    isFollowing: false,
    loadError: false,
    profileId: 'profile-a',
    username: 'alpha',
    viewerId: 'viewer',
    ...overrides,
  }
}

// The card reads the tab context to switch tabs, so it has to be rendered
// through ProfileTabs the way the real page does.
function setup(overrides: Partial<React.ComponentProps<typeof ProfileCard>> = {}) {
  return render(
    <ProfileTabs
      cloaks={null}
      connections={<div>connections tab body</div>}
      eureka={null}
      isAdmin={false}
      makeup={null}
      outfits={null}
      profile={<ProfileCard {...cardProps(overrides)} />}
    />
  )
}

describe('ProfileCard follow affordances', () => {
  it('labels the action, not the state, once the viewer follows this profile', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(await screen.findByRole('button', { name: /^unfollow$/i })).toBeInTheDocument()
    // "Following" reads as a status and leaves people unsure what a click does.
    expect(screen.queryByRole('button', { name: /^following$/i })).not.toBeInTheDocument()
  })

  it('switches to the Connections tab when the count is clicked', async () => {
    const user = userEvent.setup()
    setup()

    expect(screen.queryByText('connections tab body')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /12 following/i }))

    expect(await screen.findByText('connections tab body')).toBeInTheDocument()
  })
})
