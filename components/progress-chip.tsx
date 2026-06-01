import { CardSize } from '@/lib/types/props'
import { Check, MoreHoriz } from '@mui/icons-material'
import { Chip } from '@mui/material'

export default function ProgressChip({
  percentage,
  size = 'sm',
}: {
  percentage: number
  size?: CardSize
}) {
  const isComplete = percentage === 100
  const completeLabel = size === 'sm' ? <Check /> : 'Complete'
  const unfinishedLabel = size === 'sm' ? `${percentage}%` : 'Unfinished'

  if (size === 'xs')
    return (
      <Chip
        color={isComplete ? 'success' : 'default'}
        label={isComplete ? <Check /> : <MoreHoriz />}
        size="small"
        sx={{ bgcolor: isComplete ? 'success' : 'surface.container' }}
      />
    )

  return (
    <Chip
      color={isComplete ? 'success' : 'default'}
      label={isComplete ? completeLabel : unfinishedLabel}
      size="small"
      sx={{
        fontWeight: 'bold',
        textTransform: 'uppercase',
        bgcolor: isComplete ? 'success' : 'surface.container',
      }}
    />
  )
}
