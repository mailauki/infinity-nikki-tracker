import { ReactNode } from 'react'
import { Box, Card, CardContent, CardHeader, Skeleton, Stack, Typography } from '@mui/material'

// Shared chart card for the profile collection charts. Owns the outlined Card,
// the overline header, the pre-mount Skeleton fallback, and the flex-wrap row
// that lays the chart out beside its legend — so each chart only supplies its
// title, size, chart body, and legend body. The chart side keeps a fixed square
// footprint (so the ring/pie has room) while the legend side grows to fill the
// rest and both wrap to a column when the card gets narrow.
export function ChartCard({
  title,
  size,
  mounted,
  chart,
  legend,
}: {
  title: ReactNode
  /** Square footprint of the chart body; also the skeleton height. */
  size: number
  /** Charts read color-scheme state, so they render a skeleton until mounted. */
  mounted: boolean
  chart: ReactNode
  legend: ReactNode
}) {
  if (!mounted) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton height={size} variant="rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        sx={{ mt: -1 }}
        title={
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          useFlexGap
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Box
            sx={{
              position: 'relative',
              width: size,
              height: size,
              flexShrink: 0,
              flexGrow: 1,
              minWidth: '200px',
            }}
          >
            {chart}
          </Box>
          <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: '200px' }}>
            {legend}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
