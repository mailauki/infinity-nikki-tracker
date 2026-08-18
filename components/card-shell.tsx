'use client'

import { ReactNode } from 'react'
import { Box, Card, Grow, IconButton } from '@mui/material'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'

// Length of the Grow exit transition.
export const CARD_EXIT_MS = 300

// How long the filter pipelines keep a completed card in the list so the exit
// above can actually play (see hooks/use-exit-hold.ts). Slightly longer than the
// transition so the card has finished animating before the list drops it and the
// grid reflows — the two timers start in the same commit and their firing order
// is otherwise unspecified.
export const CARD_EXIT_HOLD_MS = CARD_EXIT_MS + 50

export function CollectionToggle({
  show,
  obtained,
  label,
  onToggle,
}: {
  show: boolean
  obtained: boolean
  label: string
  onToggle: () => void
}) {
  if (!show) return null
  return (
    <IconButton aria-label={label} aria-pressed={obtained} onClick={onToggle}>
      {obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
    </IconButton>
  )
}

export default function CardShell({
  in: shown,
  animateExit = false,
  unmountOnExit,
  onExited,
  raised,
  topLeft,
  topRight,
  children,
}: {
  in: boolean
  // Whether this card can ever animate out. The Grow exists for exactly one
  // moment: completing a card while the "missing" filter is active, so it leaves
  // the filtered view smoothly instead of vanishing. Any other time the obtained
  // toggle just swaps its own icon and the card stays put — `in` is pinned true
  // and the transition can never run.
  //
  // So it is only mounted when it can actually do something. A Grow costs a
  // react-transition-group Transition, a cloneElement and inline transition
  // styles per card, and these grids hold hundreds of cards at once (thousands
  // on the non-virtualized /eureka). It also keeps exiting cards mounted for its
  // full 300ms under `unmountOnExit`, which is the residual double-mount frame
  // in docs/superpowers/specs/2026-07-30-known-issue-standard-grid-flash.md.
  animateExit?: boolean
  unmountOnExit?: boolean
  onExited?: () => void
  raised?: boolean
  topLeft?: ReactNode
  topRight?: ReactNode
  children: ReactNode
}) {
  const card = (
    <Card level={raised ? 'high' : 'low'} sx={{ position: 'relative', flexGrow: 1 }}>
      {children}
      {topLeft && <Box sx={{ position: 'absolute', top: 12, left: 12 }}>{topLeft}</Box>}
      {topRight && <Box sx={{ position: 'absolute', top: 8, right: 8 }}>{topRight}</Box>}
    </Card>
  )

  // No animation to run: render the Card straight. `in` is still honoured so a
  // caller that hides a card without wanting a transition behaves sensibly.
  if (!animateExit) return shown ? card : null

  return (
    <Grow in={shown} timeout={CARD_EXIT_MS} unmountOnExit={unmountOnExit} onExited={onExited}>
      {card}
    </Grow>
  )
}
