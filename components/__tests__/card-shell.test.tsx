import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CardShell from '@/components/card-shell'

// The Grow wrapper drives the card through inline transition styles, so their
// presence is the tell for whether a transition was mounted at all.
function card() {
  return screen.getByText('content').closest('.MuiCard-root') as HTMLElement
}

describe('CardShell', () => {
  it('mounts no transition when the card cannot animate out', () => {
    render(
      <CardShell in>
        <span>content</span>
      </CardShell>
    )

    // The card is the plain MUI Card — no cloned transition styles. Every card
    // outside the "missing" filter takes this path, which is nearly all of them.
    expect(card().style.transition).toBe('')
    expect(card().style.transform).toBe('')
  })

  it('mounts the transition when the card can animate out', () => {
    render(
      <CardShell animateExit in>
        <span>content</span>
      </CardShell>
    )

    expect(card().style.transition).not.toBe('')
  })

  it('removes a hidden card immediately when there is no exit animation', () => {
    const { rerender } = render(
      <CardShell in>
        <span>content</span>
      </CardShell>
    )
    expect(screen.getByText('content')).toBeInTheDocument()

    rerender(
      <CardShell in={false}>
        <span>content</span>
      </CardShell>
    )
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })

  it('keeps a hidden card mounted while it animates out', () => {
    const { rerender } = render(
      <CardShell animateExit in unmountOnExit>
        <span>content</span>
      </CardShell>
    )

    rerender(
      <CardShell animateExit unmountOnExit in={false}>
        <span>content</span>
      </CardShell>
    )
    // Still there — this is the one case the Grow exists for.
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('renders the corner badges', () => {
    render(
      <CardShell in topLeft={<span>badge-left</span>} topRight={<span>badge-right</span>}>
        <span>content</span>
      </CardShell>
    )

    expect(screen.getByText('badge-left')).toBeInTheDocument()
    expect(screen.getByText('badge-right')).toBeInTheDocument()
  })
})
