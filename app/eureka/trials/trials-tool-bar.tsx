'use client'

import { Stack } from '@mui/material'
import SubAppBar from '@/components/sub-appbar'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function TrialsToolBar() {
  return (
    <SubAppBar>
      <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
        <SortButton />
      </Stack>
    </SubAppBar>
  )
}
