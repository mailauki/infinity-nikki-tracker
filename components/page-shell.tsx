import { Box, Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

export type PageWidth = 'full' | 'wide' | 'md' | 'sm' | 'xs'

// Maps the width vocabulary to a max-width cap. 'full' is uncapped so the card
// grids on /eureka and /outfits keep reflowing when the filter drawer narrows the
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
  /** Vertical spacing between direct children of the main column. Default 3. */
  spacing?: number
  /** Escape hatch for one-off overrides on the outer wrapper. */
  sx?: SxProps<Theme>
}

// Shared page shell: centers content, applies a per-domain max-width, and bakes in
// the vertical rhythm that pages previously re-declared ad hoc. `minWidth: 0` on the
// main column is essential — it lets CSS grids shrink instead of overflowing, so the
// filter drawer's width change reaches the inner container-query grid. The shell does
// NOT set `containerType`; the grids own their own inline-size container.
export default function PageShell({
  children,
  maxWidth = 'full',
  sideContent,
  spacing = 2,
  sx,
}: PageShellProps) {
  const cap = WIDTH_MAP[maxWidth]

  const main = (
    <Stack spacing={spacing} sx={{ flexGrow: 1, minWidth: 0, px: 2 }}>
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
    <Box
      sx={{
        width: '100%',
        maxWidth: cap === 'none' ? 'none' : cap,
        mx: 'auto',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        ...sx,
      }}
    >
      <Box sx={{ flexGrow: 1, order: { md: 1 }, minWidth: 0 }}>{main}</Box>
      <Box sx={{ order: { md: 2 }, width: { md: 320 }, minWidth: { md: 240 }, flexShrink: 0 }}>
        {sideContent}
      </Box>
    </Box>
  )
}
