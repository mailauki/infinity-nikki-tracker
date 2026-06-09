'use client'

import Link from 'next/link'
import { Button, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

export default function LooksEmptyState() {
  return (
    <Stack
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'center', py: 8, textAlign: 'center' }}
    >
      <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">No looks yet</Typography>
        <Typography color="textSecondary" variant="body2">
          Mix and match eureka and outfit pieces to save your own custom looks.
        </Typography>
      </Stack>
      <Button component={Link} href="/looks/new" startIcon={<AddIcon />} variant="contained">
        Create your first look
      </Button>
    </Stack>
  )
}
