'use client'

import * as React from 'react'
import { Box } from '@mui/material'
import { useProfileTabs } from './profile-tabs-context'

export default function ProfileTabsContent({
  profile,
  outfits,
  eureka,
  makeup,
  cloaks,
}: {
  profile: React.ReactNode
  outfits: React.ReactNode
  eureka: React.ReactNode
  makeup: React.ReactNode
  cloaks: React.ReactNode
}) {
  const { tab, statsView } = useProfileTabs()
  const ref = React.useRef<HTMLDivElement>(null)
  const [fillHeight, setFillHeight] = React.useState<string>('100dvh')

  // The chrome above this card (AppBar row, mask spacer, page toolbar row, sticky
  // bar) is responsive and varies per tab, so deriving it from hardcoded Toolbar
  // heights is fragile — the breakpoint queries overlap and the sticky row is
  // conditional. Measure the card's own offset instead and fill what's left.
  React.useLayoutEffect(() => {
    if (tab !== 'profile') return
    const el = ref.current
    if (!el) return

    const measure = () => {
      // Clear the previous tab's height first: an oversized wrapper keeps the
      // page scrolled/stretched, so reading `top` while it still applies
      // measures the old layout and the value never converges.
      el.style.height = 'auto'
      const top = el.getBoundingClientRect().top
      el.style.removeProperty('height')
      setFillHeight(`${Math.max(0, window.innerHeight - top)}px`)
    }

    measure()

    // Portalled chrome mounts and unmounts around this card: the toolbar tabs
    // land after the first run (pushing it down), and leaving the Stats tab
    // removes the sticky bar (pulling it up). Measuring once latches whichever
    // arrangement existed at that instant — 600px off in the worst case — so
    // re-measure on the next frame, once the portals have settled.
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [tab])

  return (
    <>
      {/* Full-bleed: cancel LayoutShell's <main> px:2 gutter so the hero spans
          the content column edge to edge. */}
      <Box
        ref={ref}
        hidden={tab !== 'profile'}
        sx={{ mx: -2, height: fillHeight, overflow: 'hidden' }}
      >
        {tab === 'profile' && profile}
      </Box>
      {/* One block per stats view. Kept as a mapped list rather than four
          near-identical Boxes; each still renders its content only while
          selected, so an unviewed collection's charts never mount. */}
      {(
        [
          ['outfits', outfits],
          ['eureka', eureka],
          ['makeup', makeup],
          ['cloaks', cloaks],
        ] as const
      ).map(([view, content]) => (
        <Box key={view} hidden={tab !== 'stats' || statsView !== view}>
          {tab === 'stats' && statsView === view && content}
        </Box>
      ))}
    </>
  )
}
