'use client'

import { Compare } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useMakeupImageMode } from '@/components/makeup/makeup-image-mode-context'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

// The image swap for a season page, which is the one page rendering BOTH outfit
// and makeup cards in the same grid. Each domain keeps its own image-mode
// context, so the shared ImageModeButton — which drives only the outfit one —
// left every makeup piece on its main image while the outfit cards swapped.
//
// This drives both contexts from one control. The outfit mode is the one shown,
// since outfit cards are the majority on a season page; the makeup context is
// pushed to match rather than cycled independently, so the two can never drift
// out of step if one of them was already toggled elsewhere.
export default function SeasonImageModeButton() {
  const { mode, cycleMode } = useOutfitImageMode()
  const { setMode: setMakeupMode } = useMakeupImageMode()

  const onClick = () => {
    cycleMode()
    setMakeupMode(mode === 'alt' ? 'image' : 'alt')
  }

  return (
    <Tooltip title={IMAGE_MODE_LABEL[mode]}>
      <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={onClick}>
        <Compare />
      </IconButton>
    </Tooltip>
  )
}
