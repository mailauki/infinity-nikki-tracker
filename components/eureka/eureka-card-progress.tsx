import { CardContent, LinearProgress, Stack, Typography } from '@mui/material'

import ProgressBadge from '../progress-chip'

export default function EurekaCardProgress({
  percentage,
  variant = 'default',
}: {
  percentage: number
  variant?: 'default' | 'large'
}) {
  return (
    <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" component="p">
          {percentage}%
        </Typography>
        <ProgressBadge percentage={percentage} size={variant === 'large' ? 'medium' : 'small'} />
      </Stack>
      <LinearProgress value={percentage} variant="determinate" color="inherit" />
    </CardContent>
  )
}
