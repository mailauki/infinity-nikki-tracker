import { Box, Divider, Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import {
  GRID_COLUMNS_CONTAINER,
  GRID_CONTAINER,
  OUTFIT_GRID_COLUMNS_CONTAINER,
} from '@/lib/types/props'

// Named column presets for the two card families. Both are container-query grids
// (they read the CONTENT width, not the viewport) so they reflow when the filter
// drawer narrows the column. Pass a custom sx object to opt out of the presets
// (e.g. the viewport-breakpoint grid on the outfit detail page).
const COLUMN_PRESETS = {
  eureka: GRID_COLUMNS_CONTAINER, // 3 / 4 / 5
  outfit: OUTFIT_GRID_COLUMNS_CONTAINER, // 2 / 3 / 4 / 6 / 8
} as const

export type CardGridColumns = keyof typeof COLUMN_PRESETS | SxProps<Theme>

// Responsive gap value: a single spacing unit or a per-breakpoint object.
type GapValue = number | string | Record<string, number | string>

// Standard responsive gap shared by every card grid; overridable per call.
const DEFAULT_GAP: GapValue = { xs: 1, sm: 1.5, md: 2 }

export interface CardGridProps {
  children: React.ReactNode
  /** Column preset name ('eureka' | 'outfit') or a custom columns sx. Default 'eureka'. */
  columns?: CardGridColumns
  /** Grid gap. Default { xs: 1, sm: 1.5, md: 2 }. */
  gap?: GapValue
  /** Optional block rendered above the grid, inside the inline-size container. */
  header?: React.ReactNode
  /** Extra sx merged onto the grid box (e.g. py). */
  sx?: SxProps<Theme>
}

// The standard card grid: an inline-size container wrapping a CSS grid with a
// column preset and the shared gap. Consolidates the repeated
// `<Box sx={GRID_CONTAINER}><Box display:grid ...COLUMNS gap>` boilerplate.
export default function CardGrid({
  children,
  columns = 'eureka',
  gap = DEFAULT_GAP,
  header,
  sx,
}: CardGridProps) {
  const columnsSx = typeof columns === 'string' ? COLUMN_PRESETS[columns] : columns

  return (
    <Box sx={GRID_CONTAINER}>
      {header}
      <Box sx={{ display: 'grid', ...columnsSx, gap, ...sx } as SxProps<Theme>}>{children}</Box>
    </Box>
  )
}

export interface SimpleGridProps {
  children: React.ReactNode
  /** Responsive column template, e.g. { xs: '1fr', sm: '1fr 1fr' } or 'repeat(2, 1fr)'. */
  columns: string | Record<string, string>
  /** Grid gap. Default 2. */
  gap?: GapValue
  /** Extra sx merged onto the grid box. */
  sx?: SxProps<Theme>
}

// A lightweight viewport-breakpoint grid for simple 2-up / 3-up card layouts
// (stat cards, feature cards, quick links). Unlike CardGrid, it does NOT create
// an inline-size container or use the card-family column presets — the columns are
// specified explicitly per call. Consolidates the repeated
// `<Box sx={{ display:'grid', gridTemplateColumns, gap }}>` boilerplate.
export function SimpleGrid({ children, columns, gap = 2, sx }: SimpleGridProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap, ...sx } as SxProps<Theme>}>
      {children}
    </Box>
  )
}

export interface CardGridHeaderProps {
  /** Left side — usually the set title link/button. */
  title: React.ReactNode
  /** Right side — usually progress chips / actions. */
  actions?: React.ReactNode
  /** Render the divider below the header row. Default true. */
  divider?: boolean
}

// The recurring set-header shape (title on the left, actions on the right, divider
// below) that wraps most card grids. Drop into CardGrid's `header` slot.
export function CardGridHeader({ title, actions, divider = true }: CardGridHeaderProps) {
  return (
    <>
      <Stack
        direction="row"
        sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        {title}
        {actions}
      </Stack>
      {divider && <Divider sx={{ mb: 2 }} />}
    </>
  )
}
