import { CardContent, LinearProgress, Stack, Typography } from '@mui/material'

import { CardSize } from '@/lib/types/types'
import ProgressChip from '../progress-chip'

export default function EurekaCardProgress({
  percentage,
  size = 'md',
}: {
  percentage: number
  size?: CardSize
}) {
  return (
    <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
      {size !== 'sm' && (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="p">
            {percentage}%
          </Typography>
          <ProgressChip percentage={percentage} size={size} />
        </Stack>
      )}
      <LinearProgress value={percentage} variant="determinate" color="inherit" />
    </CardContent>
  )
}
