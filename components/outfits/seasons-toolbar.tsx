'use client'

import { Stack, Typography } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function SeasonsToolBar({ count }: { count: number }) {
  return (
    <NavBarToolbar>
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
          <SortButton />
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}
