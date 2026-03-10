import {
  Avatar,
  Box,
  CardContent,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'

import { CardSize } from '@/lib/types/props'
import ProgressChip from '../progress-chip'
import { Check } from '@mui/icons-material'

export default function EurekaCardProgress({
  percentage,
  size = 'md',
}: {
  percentage: number
  size?: CardSize
}) {
  if (size === 'xs')
    return (
      <CardContent component={Stack} spacing={1} alignItems="center" sx={{ pt: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            value={percentage}
            variant="determinate"
            color={percentage === 100 ? 'primary' : 'inherit'}
            size={64}
            sx={{ backgroundColor: 'divider', borderRadius: '100px' }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              p: 0.5,
            }}
          >
            <Avatar size="md" sx={{ backgroundColor: 'background.paper' }}>
              <Typography
                variant="subtitle1"
                fontWeight="medium"
                component="p"
                color={percentage === 100 ? 'primary' : 'textPrimary'}
              >
                {percentage === 100 ? <Check fontSize="large" /> : `${percentage}%`}
              </Typography>
            </Avatar>
          </Box>
        </Box>
      </CardContent>
    )

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
