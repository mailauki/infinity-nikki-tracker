import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FollowCountsRow from '@/components/follow/follow-counts'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

// The chain from .or() varies (.or().order() vs .or().neq().order()) because
// the real code calls .neq() only when viewerId is truthy. A self-returning
// chainable builder handles both shapes instead of hardcoding one fixed chain
// — see components/__tests__/follow-dialog.test.tsx, which this mirrors.
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

const ALICE = { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: null }
const BOB = { id: 'u2', username: 'bob', display_name: 'Bob', avatar_url: null }

function setup(props: Partial<React.ComponentProps<typeof FollowCountsRow>> = {}) {
  return render(
    <FollowCountsRow
      followers={[BOB]}
      followersCount={34}
      following={[ALICE]}
      followingCount={12}
      viewerFollowingIds={new Set<string>()}
      viewerId="viewer"
      {...props}
    />
  )
}

describe('FollowCountsRow', () => {
  it('shows both counts', () => {
    setup()
    expect(screen.getByRole('button', { name: /12 following/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /34 followers/i })).toBeInTheDocument()
  })

  // Buttons, not clickable Typography: a Typography is neither focusable nor
  // announced as a control.
  it('exposes the counts as real buttons', () => {
    setup()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('opens the dialog on the following tab', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /12 following/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('opens the dialog on the followers tab', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /34 followers/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
  })

  // The viewer's own Following count must move when they follow/unfollow a
  // row inside their own profile's dialog. The count button sits behind the
  // open Dialog, which MUI marks aria-hidden on the rest of the app while
  // open, so assert by text rather than role until the dialog is closed.
  it('increments the displayed Following count when a row is followed on the viewer’s own profile', async () => {
    const user = userEvent.setup()
    setup({ profileId: 'viewer', viewerId: 'viewer' })

    await user.click(screen.getByRole('button', { name: /12 following/i }))
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('button', { name: /^follow$/i }))
    await user.keyboard('{Escape}')

    expect(await screen.findByRole('button', { name: /13 following/i })).toBeInTheDocument()
  })

  // On someone else's profile, following a person listed in THEIR modal does
  // not change THAT profile's Following count.
  it('does not change the Following count when following a row on someone else’s profile', async () => {
    const user = userEvent.setup()
    setup({ profileId: 'someone-else', viewerId: 'viewer' })

    await user.click(screen.getByRole('button', { name: /12 following/i }))
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('button', { name: /^follow$/i }))
    await user.keyboard('{Escape}')

    expect(await screen.findByRole('button', { name: /12 following/i })).toBeInTheDocument()
  })
})
