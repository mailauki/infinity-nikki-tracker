import { CardSize } from '@/lib/types/types'
import { Check, MoreHoriz } from '@mui/icons-material'
import { Chip } from '@mui/material'

export default function ProgressChip({ percentage, size }: { percentage: number; size: CardSize }) {
  const isComplete = percentage === 100
  const completeLabel = size === 'md' ? <Check /> : 'Complete'
  const unfinishedLabel = size === 'md' ? <MoreHoriz /> : 'Unfinished'

  if (size === 'sm') return null

  return (
    <Chip
      size={size === 'md' ? 'small' : 'medium'}
      sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
      color={isComplete ? 'primary' : 'default'}
      label={isComplete ? completeLabel : unfinishedLabel}
    />
  )
}
