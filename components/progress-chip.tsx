import { Check, MoreHoriz } from '@mui/icons-material'
import { Chip } from '@mui/material'

export default function ProgressChip({
  percentage,
  size = 'medium',
}: {
  percentage: number
  size?: 'small' | 'medium'
}) {
  const isComplete = percentage === 100
  const completeLabel = size === 'small' ? <Check /> : 'Complete'
  const unfinishedLabel = size === 'small' ? <MoreHoriz /> : 'Unfinished'

  return (
    <Chip
      size={size}
      sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
      color={isComplete ? 'success' : 'default'}
      label={isComplete ? completeLabel : unfinishedLabel}
    />
  )
}
