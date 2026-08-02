'use client'

import { IconButton, Tooltip, Typography } from '@mui/material'
import { Compare } from '@mui/icons-material'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { SortButton } from '@/components/navbar/appbar-actions'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

export default function SeasonsToolBar({ count }: { count: number }) {
  const { mode, cycleMode } = useOutfitImageMode()

  return (
    <ToolbarSlot
      lead={
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {count} seasons
        </Typography>
      }
    >
      <Tooltip title={IMAGE_MODE_LABEL[mode]}>
        <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={cycleMode}>
          <Compare />
        </IconButton>
      </Tooltip>
      <SortButton />
    </ToolbarSlot>
  )
}
