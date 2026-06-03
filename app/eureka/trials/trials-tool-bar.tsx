'use client'

import { Stack } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function TrialsToolBar() {
  return (
    <NavBarToolbar>
      <Stack direction="row"  sx={{ flex: 1, justifyContent: "flex-end" }}>
        <SortButton />
      </Stack>
    </NavBarToolbar>
  )
}
