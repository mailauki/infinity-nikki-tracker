import { Box, Stack } from '@mui/material'
import { ReactNode } from 'react'

// Responsive two-up grid for the profile collection cards: one column until
// `md`, two columns from `md` up. Shared by the eureka & outfit chart groups.
export function CardsGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      {children}
    </Box>
  )
}

// Horizontal chart-and-legend row that wraps to a column when it runs out of
// width. Each child sets its own `flexGrow`/`minWidth` to control wrapping.
export function ChartRow({ children }: { children: ReactNode }) {
  return (
    <Stack useFlexGap direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      {children}
    </Stack>
  )
}
