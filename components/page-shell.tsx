import { Box, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

export type PageWidth = 'full' | 'wide' | 'md' | 'sm' | 'xs'

// Clip pattern, not `visibility: hidden` or `display: none` — those drop the
// node from the accessibility tree, so a heading hidden that way is announced
// to nobody and does nothing for reader mode. This keeps the h1 in the tree and
// in the document outline while taking no visual space.
const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

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
  /**
   * Element for the main column. Prose routes pass 'article' so browser reader
   * modes have a content root to extract; card-grid routes leave it a div.
   */
  component?: React.ElementType
  /** Per-domain width variant. Default 'full' preserves the card-grid behavior. */
  maxWidth?: PageWidth
  /** Optional right-hand column (md+); stacks above the main content below md. */
  sideContent?: React.ReactNode
  /** Vertical spacing between direct children of the main column. Default 2. */
  spacing?: number
  /** Escape hatch for one-off overrides on the outer wrapper. */
  sx?: SxProps<Theme>
  /**
   * The page's h1, rendered as the first child of the content root. Pass this on
   * routes whose visible design has no heading of its own: the app-bar's
   * PageTitle is nav chrome and deliberately not an h1, so without this a page
   * has no top-level heading and reader mode promotes whatever h2 comes first.
   * Set `titleVisible` to show it; it is visually hidden but screen-reader and
   * outline visible by default.
   */
  title?: React.ReactNode
  /** Render `title` visibly instead of clipping it. Default false. */
  titleVisible?: boolean
}

// Thin per-page width wrapper. Horizontal padding, minWidth:0 (grid reflow), and
// the content gutter now live in LayoutShell's <main>; this component only caps the
// max-width per domain and optionally lays out an inline side column. The main
// column keeps minWidth:0 so CSS grids shrink instead of overflowing.
export default function PageShell({
  children,
  component = 'div',
  maxWidth = 'full',
  sideContent,
  spacing = 2,
  sx,
  title,
  titleVisible = false,
}: PageShellProps) {
  const cap = WIDTH_MAP[maxWidth]

  const main = (
    <Stack component={component} spacing={spacing} sx={{ flexGrow: 1, minWidth: 0 }}>
      {title ? (
        <Typography
          component="h1"
          size={titleVisible ? 'medium' : 'small'}
          sx={titleVisible ? undefined : VISUALLY_HIDDEN}
          variant="headline"
        >
          {title}
        </Typography>
      ) : null}
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
