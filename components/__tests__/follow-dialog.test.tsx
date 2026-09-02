import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FollowDialog from '@/components/follow/follow-dialog'
import type { FollowProfile } from '@/lib/types/follows'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const searchResults = vi.fn(() =>
  Promise.resolve<{ data: FollowProfile[]; error: null }>({ data: [], error: null })
)

// CORRECTION 1: the implementation calls .neq() only when viewerId is truthy,
// so the chain from .or() varies (.or().order() vs .or().neq().order()). A
// self-returning chainable builder handles both shapes instead of hardcoding
// one fixed chain.
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

const ALICE = { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: null }
const BOB = { id: 'u2', username: 'bob', display_name: 'Bob', avatar_url: null }

function setup(props: Partial<React.ComponentProps<typeof FollowDialog>> = {}) {
  return render(
    <FollowDialog
      open
      followers={[BOB]}
      following={[ALICE]}
      tab="following"
      viewerFollowingIds={new Set(['u1'])}
      viewerId="viewer"
      onClose={() => {}}
      onTabChange={() => {}}
      {...props}
    />
  )
}

describe('FollowDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchResults.mockResolvedValue({ data: [], error: null })
  })

  it('lists the following tab by default', () => {
    setup()
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.queryByText('@bob')).not.toBeInTheDocument()
  })

  it('lists followers when opened on that tab', () => {
    setup({ tab: 'followers' })
    expect(screen.getByText('@bob')).toBeInTheDocument()
    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
  })

  it('shows an empty state rather than a blank body', () => {
    setup({ following: [] })
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument()
  })

  it('swaps the body to search results while a query is present', async () => {
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'bob')

    // The tab list is replaced by results, not filtered in place.
    expect(await screen.findByText('@bob')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('@alice')).not.toBeInTheDocument())
  })

  it('restores the tab list when the query is cleared', async () => {
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    const user = userEvent.setup()
    setup()

    const input = screen.getByRole('textbox', { name: /search/i })
    await user.type(input, 'bob')
    await screen.findByText('@bob')

    await user.clear(input)

    expect(await screen.findByText('@alice')).toBeInTheDocument()
  })

  it('tells the user when a search returns nothing', async () => {
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'zzz')

    expect(await screen.findByText(/no profiles found/i)).toBeInTheDocument()
  })

  // Regression: an in-flight search whose query then escapes to empty (e.g.
  // trailing dots stripped by isSearchable) must not strand "Searching…"
  // forever — both early-return paths have to clear the flag too.
  it('does not strand "Searching…" when the query escapes to empty mid-request', async () => {
    let resolveSearch: (value: { data: FollowProfile[]; error: null }) => void = () => {}
    searchResults.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve
      })
    )
    const user = userEvent.setup()
    setup()

    const input = screen.getByRole('textbox', { name: /search/i })
    await user.type(input, 'bob')

    await waitFor(() => expect(screen.getByText(/searching/i)).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '..')

    expect(screen.queryByText(/searching/i)).not.toBeInTheDocument()

    resolveSearch({ data: [], error: null })
  })

  // CORRECTION 2: signed-out visitors must still see counts/lists (follow
  // rows are public-read) but get NO follow buttons anywhere in the dialog,
  // including in search results.
  it('renders lists and search results with no follow buttons when signed out', async () => {
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    const user = userEvent.setup()
    setup({ viewerId: null })

    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /following/i })).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'bob')

    expect(await screen.findByText('@bob')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /following/i })).not.toBeInTheDocument()
  })
  // The Following tab is a server snapshot from page load. Following someone
  // from search has to add them to it, or the count moves while the list the
  // user opened to check stays wrong until a reload.
  it('adds a newly followed profile to the Following list', async () => {
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    const user = userEvent.setup()
    setup({ following: [ALICE], viewerFollowingIds: new Set(['u1']) })

    // Bob is not in the Following list yet.
    expect(screen.queryByText('@bob')).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'bob')
    const row = await screen.findByText('@bob')
    expect(row).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    // Clearing the query returns to the Following tab, which must now list Bob.
    await user.clear(screen.getByRole('textbox', { name: /search/i }))

    expect(await screen.findByText('@bob')).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('removes an unfollowed profile from the Following list', async () => {
    const user = userEvent.setup()
    setup({ following: [ALICE], viewerFollowingIds: new Set(['u1']) })

    expect(screen.getByText('@alice')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /following/i }))

    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument()
  })

  // The Followers tab lists people who follow THIS profile. The viewer
  // following someone does not make that person a follower, so it must not move.
  it('does not change the Followers list when the viewer follows someone', async () => {
    const user = userEvent.setup()
    setup({ followers: [BOB], following: [ALICE], tab: 'followers' })

    expect(screen.getByText('@bob')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(screen.getByText('@bob')).toBeInTheDocument()
  })

})
