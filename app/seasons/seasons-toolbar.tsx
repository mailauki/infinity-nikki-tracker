'use client'

import { Typography } from '@mui/material'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { SortButton } from '@/components/navbar/appbar-actions'
import ImageModeButton from '@/components/navbar/image-mode-button'

export default function SeasonsToolBar({ count }: { count: number }) {
  return (
    <ToolbarSlot
      lead={
        <Typography color="textSecondary" size="small" sx={{ whiteSpace: 'nowrap' }} variant="body">
          Showing: {count} seasons
        </Typography>
      }
    >
      <ImageModeButton />
      <SortButton />
    </ToolbarSlot>
  )
}
