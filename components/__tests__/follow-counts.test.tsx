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

function setup() {
  return render(
    <FollowCountsRow
      followers={[BOB]}
      followersCount={34}
      following={[ALICE]}
      followingCount={12}
      viewerFollowingIds={new Set<string>()}
      viewerId="viewer"
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
})
