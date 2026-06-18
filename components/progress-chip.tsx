import { percent } from '@/hooks/count-obtained'
import { CardSize } from '@/lib/types/props'
import { Check, MoreHoriz } from '@mui/icons-material'
import { Chip } from '@mui/material'

export default function ProgressChip({
  obtained,
  total,
  size = 'sm',
  variant = 'percent',
}: {
  obtained: number
  total: number
  size?: CardSize
  variant?: 'percent' | 'parts'
}) {
  const percentage = percent(obtained, total)
  const isComplete = percentage === 100
  const completeLabel = size === 'sm' ? <Check /> : 'Complete'
  const unfinishedLabel = size === 'sm' ? `${percentage}%` : 'Unfinished'

  if (variant === 'parts') {
    return (
      <Chip
        color={isComplete ? 'success' : 'default'}
        label={isComplete ? <Check /> : `${obtained} / ${total}`}
        size="small"
        sx={{ bgcolor: 'surface.containerHover' }}
        variant="outlined"
      />
    )
  }

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
