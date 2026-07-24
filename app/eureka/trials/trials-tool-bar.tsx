'use client'

import { Stack } from '@mui/material'
import ToolbarSlot from '@/components/toolbar-slot'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function TrialsToolBar() {
  return (
    <ToolbarSlot>
      <Stack direction="row" sx={{ flex: 1, justifyContent: 'flex-end' }}>
        <SortButton />
      </Stack>
    </ToolbarSlot>
  )
}
