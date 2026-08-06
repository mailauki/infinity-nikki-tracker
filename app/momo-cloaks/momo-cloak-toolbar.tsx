'use client'

import { IconButton, Tooltip } from '@mui/material'
import { Compare } from '@mui/icons-material'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

import MomoCloakFilterMenu from './momo-cloak-filter-menu'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

export default function MomoCloakToolBar() {
  const { mode, cycleMode } = useOutfitImageMode()

  return (
    <ToolbarSlot>
      <Tooltip title={IMAGE_MODE_LABEL[mode]}>
        <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={cycleMode}>
          <Compare />
        </IconButton>
      </Tooltip>
      <MomoCloakFilterMenu />
    </ToolbarSlot>
  )
}
