import { Percentage } from '@/lib/types/props'
import { Check } from '@mui/icons-material'
import { Typography } from '@mui/material'

export default function PercentLabel({ percentage }: { percentage: Percentage }) {
  return (
    <Typography
      color={percentage === 100 ? 'primary' : 'textPrimary'}
      size="large"
      sx={{ pb: 0.5, fontWeight: 'medium' }}
      variant="title"
    >
      {percentage === 100 ? <Check fontSize="large" /> : `${percentage}`}
      {percentage !== 100 && (
        <Typography component="span" size="small" variant="body">
          {' '}
          %
        </Typography>
      )}
    </Typography>
  )
}
