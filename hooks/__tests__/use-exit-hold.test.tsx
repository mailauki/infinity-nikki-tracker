import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardShell, { CARD_EXIT_HOLD_MS } from '@/components/card-shell'
import { useExitHold } from '@/hooks/use-exit-hold'

// Mirrors the real shape: a parent whose filter culls an item the moment it is
// obtained, and a child that both flips that optimistic state and starts its own
// exit animation in the same click handler.
function Grid({ onRender }: { onRender?: () => void }) {
  const [obtained, setObtained] = useState(false)
  const { exitingKeys, holdExit } = useExitHold(CARD_EXIT_HOLD_MS)
  onRender?.()

  // The "missing" filter: culled once obtained, unless it is animating out.
  const visible = !obtained || exitingKeys.has('card-1')

  return (
    <div>
      {visible && (
        <Card
          onToggle={() => {
            setObtained(true) // optimistic, urgent — same as the providers
            holdExit(['card-1'])
          }}
        />
      )}
    </div>
  )
}

function Card({ onToggle }: { onToggle: () => void }) {
  const [exiting, setExiting] = useState(false)
  return (
    <CardShell animateExit unmountOnExit in={!exiting}>
      <button
        onClick={() => {
          onToggle()
          setExiting(true)
        }}
      >
        toggle
      </button>
    </CardShell>
  )
}

describe('useExitHold', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('keeps a culled card mounted so its exit animation can play', () => {
    render(<Grid />)

    act(() => {
      screen.getByText('toggle').click()
    })

    // Without the hold the parent unmounts it in this same commit and the Grow
    // never paints a frame. It has to survive the click to animate at all.
    expect(screen.getByText('toggle')).toBeInTheDocument()
  })

  it('drops the card once the hold expires', () => {
    render(<Grid />)

    act(() => {
      screen.getByText('toggle').click()
    })
    act(() => {
      vi.advanceTimersByTime(CARD_EXIT_HOLD_MS + 10)
    })

    expect(screen.queryByText('toggle')).not.toBeInTheDocument()
  })

  it('keeps the card on screen through the middle of the animation', () => {
    render(<Grid />)

    act(() => {
      screen.getByText('toggle').click()
    })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // Mid-Grow. (Past 300ms the transition's own `unmountOnExit` removes the
    // card; the hold runs 50ms longer so the list reflows only after that.)
    expect(screen.getByText('toggle')).toBeInTheDocument()
  })

  it('outlives the exit transition it is covering', () => {
    // The hold has to be the longer of the two, or the list drops the card
    // mid-animation and the grid reflows under it.
    expect(CARD_EXIT_HOLD_MS).toBeGreaterThan(300)
  })

  it('leaves no timer behind when the grid unmounts mid-animation', () => {
    const { unmount } = render(<Grid />)
    act(() => {
      screen.getByText('toggle').click()
    })

    unmount()
    // A surviving timer would fire setExitingKeys on an unmounted tree.
    expect(() => act(() => vi.advanceTimersByTime(CARD_EXIT_HOLD_MS * 2))).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })
})
