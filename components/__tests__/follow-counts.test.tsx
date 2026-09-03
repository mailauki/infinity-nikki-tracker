import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FollowCountsRow from '@/components/follow/follow-counts'

// This row no longer owns a dialog, a search, or a followers count — both lists
// moved to the profile's Connections tab, so its whole job is to show the
// Following number and hand a click back to the parent. The count-reconciliation
// cases this file used to guard (a dialog row moving the viewer's own Following
// count) went away with the dialog; the tab's own tests cover the lists.

function setup(props: Partial<React.ComponentProps<typeof FollowCountsRow>> = {}) {
  return render(<FollowCountsRow followingCount={12} {...props} />)
}

describe('FollowCountsRow', () => {
  it('shows the following count', () => {
    setup()
    expect(screen.getByRole('button', { name: /12 following/i })).toBeInTheDocument()
  })

  // A button, not a clickable Typography: a Typography is neither focusable nor
  // announced as a control. The visible label is a bare number, so the
  // accessible name has to supply the meaning.
  it('exposes the count as a real button with a meaningful name', () => {
    setup()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName(/following/i)
  })

  it('asks the parent to open connections on the following direction', async () => {
    const user = userEvent.setup()
    const onOpenConnections = vi.fn()
    setup({ onOpenConnections })

    await user.click(screen.getByRole('button', { name: /12 following/i }))

    expect(onOpenConnections).toHaveBeenCalledWith('following')
  })

  // The card is reconciled in place across a client navigation between two
  // profiles, so a new count prop has to replace the seeded local state.
  it('re-seeds its count when the profile underneath it changes', () => {
    const { rerender } = setup()
    expect(screen.getByRole('button', { name: /12 following/i })).toBeInTheDocument()

    rerender(<FollowCountsRow followingCount={7} />)

    expect(screen.getByRole('button', { name: /7 following/i })).toBeInTheDocument()
  })
})
