'use client'

import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
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
    <ToolbarSlot>
      <Stack
        direction="row"
        sx={{
          width: '100%',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }} variant="caption">
          Showing: {count} seasons
        </Typography>
        <Stack direction="row" spacing={1} sx={{ position: 'relative', height: '40px' }}>
          <Tooltip title={IMAGE_MODE_LABEL[mode]}>
            <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={cycleMode}>
              <Compare />
            </IconButton>
          </Tooltip>
          <SortButton />
        </Stack>
      </Stack>
    </ToolbarSlot>
  )
}
