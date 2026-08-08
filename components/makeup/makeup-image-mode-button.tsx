'use client'

import { Compare } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

import { useMakeupImageMode } from '@/components/makeup/makeup-image-mode-context'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

// The main/alt image swap for makeup toolbars. Requires a MakeupImageModeProvider
// above it — outside one the context default makes this a no-op rather than throwing.
export default function MakeupImageModeButton() {
  const { mode, cycleMode } = useMakeupImageMode()

  return (
    <Tooltip title={IMAGE_MODE_LABEL[mode]}>
      <IconButton aria-label={IMAGE_MODE_LABEL[mode]} color="inherit" onClick={cycleMode}>
        <Compare />
      </IconButton>
    </Tooltip>
  )
}
