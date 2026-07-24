import { Box, Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

export type PageWidth = 'full' | 'wide' | 'md' | 'sm' | 'xs'

// Maps the width vocabulary to a max-width cap. 'full' is uncapped so the card
// grids on /eureka and /outfits keep reflowing when the sidebar narrows the
// content column (their container-query grids read content width, not viewport).
const WIDTH_MAP: Record<PageWidth, number | 'none'> = {
  full: 'none',
  wide: 1400,
  md: 900,
  sm: 600,
  xs: 480,
}

export interface PageShellProps {
  children: React.ReactNode
  /** Per-domain width variant. Default 'full' preserves the card-grid behavior. */
  maxWidth?: PageWidth
  /** Optional right-hand column (md+); stacks above the main content below md. */
  sideContent?: React.ReactNode
  /** Vertical spacing between direct children of the main column. Default 2. */
  spacing?: number
  /** Escape hatch for one-off overrides on the outer wrapper. */
  sx?: SxProps<Theme>
}

// Thin per-page width wrapper. Horizontal padding, minWidth:0 (grid reflow), and
// the content gutter now live in LayoutShell's <main>; this component only caps the
// max-width per domain and optionally lays out an inline side column. The main
// column keeps minWidth:0 so CSS grids shrink instead of overflowing.
export default function PageShell({
  children,
  maxWidth = 'full',
  sideContent,
  spacing = 2,
  sx,
}: PageShellProps) {
  const cap = WIDTH_MAP[maxWidth]

  const main = (
    <Stack spacing={spacing} sx={{ flexGrow: 1, minWidth: 0 }}>
      {children}
    </Stack>
  )

  if (!sideContent) {
    return (
      <Box sx={{ width: '100%', maxWidth: cap === 'none' ? 'none' : cap, mx: 'auto', ...sx }}>
        {main}
      </Box>
    )
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ width: '100%', maxWidth: cap === 'none' ? 'none' : cap, mx: 'auto', ...sx }}
    >
      <Box sx={{ flexGrow: 1, order: { md: 1 }, minWidth: 0 }}>{main}</Box>
      <Box sx={{ order: { md: 2 }, width: { md: 320 }, minWidth: { md: 240 }, flexShrink: 0 }}>
        {sideContent}
      </Box>
    </Stack>
  )
}
