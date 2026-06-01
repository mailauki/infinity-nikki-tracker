'use client'

import { Stack } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function TrialsToolBar() {
  return (
    <NavBarToolbar>
      <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
        <SortButton />
      </Stack>
    </NavBarToolbar>
  )
}
