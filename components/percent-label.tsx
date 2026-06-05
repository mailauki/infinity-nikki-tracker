import { Percentage } from '@/lib/types/props'
import { Check } from '@mui/icons-material'
import { Typography } from '@mui/material'

export default function PercentLabel({ percentage }: { percentage: Percentage }) {
  return (
    <Typography
      color={percentage === 100 ? 'primary' : 'textPrimary'}
      sx={{ pb: 0.5, fontWeight: 'medium' }}
      variant="subtitle1"
    >
      {percentage === 100 ? <Check fontSize="large" /> : `${percentage}`}
      {percentage !== 100 && (
        <Typography component="span" variant="caption">
          {' '}
          %
        </Typography>
      )}
    </Typography>
  )
}
