import {
  Avatar,
  Box,
  CardContent,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'

import { CardSize, Percentage } from '@/lib/types/props'
import PercentLabel from '@/components/percent-label'

export default function EurekaCardProgress({
  percentage,
  size = 'md',
}: {
  percentage: Percentage
  size?: CardSize
}) {
  if (size === 'xs')
    return (
      <CardContent component={Stack} spacing={1} sx={{ pt: 0, alignItems: 'center' }}>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            color={percentage === 100 ? 'primary' : 'inherit'}
            size={64}
            sx={{ backgroundColor: 'divider', borderRadius: '100px' }}
            value={percentage}
            variant="determinate"
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
              <PercentLabel percentage={percentage} />
            </Avatar>
          </Box>
        </Box>
      </CardContent>
    )

  return (
    <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
      {size !== 'sm' && (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography component="p" variant="h6">
            {percentage}%
          </Typography>
        </Stack>
      )}
      <LinearProgress color="inherit" value={percentage} variant="determinate" />
    </CardContent>
  )
}
