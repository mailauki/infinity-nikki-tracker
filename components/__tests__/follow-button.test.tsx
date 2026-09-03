import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FollowButton from '@/components/follow/follow-button'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

import { followUser, unfollowUser } from '@/lib/follow-actions'

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing for the viewer's own row", () => {
    const { container } = render(<FollowButton isLoggedIn isSelf targetId="u1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when signed out', () => {
    const { container } = render(<FollowButton isLoggedIn={false} targetId="u1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('reads "Follow" when not following', () => {
    render(<FollowButton isLoggedIn targetId="u1" />)
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  // The label names the ACTION a click performs, not the current state:
  // "Following" reads as a status and leaves people unsure what clicking does.
  it('reads "Unfollow" when already following', () => {
    render(<FollowButton isFollowing isLoggedIn targetId="u1" />)
    expect(screen.getByRole('button', { name: /^unfollow$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^following$/i })).not.toBeInTheDocument()
  })

  it('flips to Unfollow optimistically before the request settles', async () => {
    const user = userEvent.setup()
    render(<FollowButton isLoggedIn targetId="u1" />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(followUser).toHaveBeenCalledWith('u1')
    expect(screen.getByRole('button', { name: /^unfollow$/i })).toBeInTheDocument()
  })

  it('unfollows when already following', async () => {
    const user = userEvent.setup()
    render(<FollowButton isFollowing isLoggedIn targetId="u1" />)

    await user.click(screen.getByRole('button', { name: /^unfollow$/i }))

    expect(unfollowUser).toHaveBeenCalledWith('u1')
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  // The optimistic flip must not strand the UI in a state the DB disagrees with.
  it('reverts when the request fails', async () => {
    vi.mocked(followUser).mockRejectedValueOnce(new Error('nope'))
    const user = userEvent.setup()
    render(<FollowButton isLoggedIn targetId="u1" />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(await screen.findByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  it('notifies the parent so counts can update', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FollowButton isLoggedIn targetId="u1" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(onChange).toHaveBeenCalledWith(true)
  })
})
