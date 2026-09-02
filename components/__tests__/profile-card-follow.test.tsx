import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProfileCard from '@/app/profile/profile-card'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

// Matches the chainable-builder mock in follow-counts.test.tsx: the real search
// chain varies (.or().order() vs .or().neq().order()) depending on viewerId.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    const builder: Record<string, unknown> = {}
    for (const method of ['from', 'select', 'or', 'neq', 'order']) {
      builder[method] = () => builder
    }
    builder.limit = () => Promise.resolve({ data: [], error: null })
    return builder
  },
}))

function cardProps(overrides: Partial<React.ComponentProps<typeof ProfileCard>> = {}) {
  return {
    avatar_url: null,
    displayName: 'Alpha',
    followers: [],
    followersCount: 10,
    following: [],
    followingCount: 0,
    isFollowing: false,
    loadError: false,
    profileId: 'profile-a',
    username: 'alpha',
    viewerFollowingIds: new Set<string>(),
    viewerId: 'viewer',
    ...overrides,
  }
}

describe('ProfileCard follower count', () => {
  it('increments the follower count when the viewer follows this profile', async () => {
    const user = userEvent.setup()
    render(<ProfileCard {...cardProps()} />)

    expect(screen.getByRole('button', { name: /10 followers/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(await screen.findByRole('button', { name: /11 followers/i })).toBeInTheDocument()
  })

  // The follow modal's rows link straight to /u/[username], so navigating from
  // one profile to another reconciles this card in place rather than remounting
  // it. Without a reset, the +1 earned on the previous profile would still be
  // applied to the next one's follower count.
  it('does not carry a follower delta across a navigation to another profile', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ProfileCard {...cardProps()} />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))
    expect(await screen.findByRole('button', { name: /11 followers/i })).toBeInTheDocument()

    // Navigate to a different profile: new server-fetched counts, same instance.
    rerender(
      <ProfileCard
        {...cardProps({
          displayName: 'Beta',
          followersCount: 50,
          profileId: 'profile-b',
          username: 'beta',
        })}
      />
    )

    // The viewer never followed Beta, so the count must be Beta's own 50.
    expect(await screen.findByRole('button', { name: /50 followers/i })).toBeInTheDocument()
  })
})
