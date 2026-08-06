'use client'

import { Compare } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

// The main/alt image swap, as it appears in a page toolbar. Every page offering
// the swap renders this: outfits, seasons, momo-cloaks, and the slug pages.
// Requires an OutfitImageModeProvider above it — outside one the context default
// makes the button a no-op rather than throwing.
export default function ImageModeButton() {
  const { mode, cycleMode } = useOutfitImageMode()

  return (
    <Tooltip title={IMAGE_MODE_LABEL[mode]}>
      <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={cycleMode}>
        <Compare />
      </IconButton>
    </Tooltip>
  )
}
