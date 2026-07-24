'use client'

import Link from 'next/link'
import { Button, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ToolbarSlot from '@/components/toolbar-slot'

export default function LooksToolbar({ atLimit }: { atLimit: boolean }) {
  return (
    <ToolbarSlot>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle2">Custom Looks</Typography>
        <Button
          component={Link}
          disabled={atLimit}
          href="/looks/new"
          size="small"
          startIcon={<AddIcon />}
          variant="contained"
        >
          New look
        </Button>
      </Stack>
    </ToolbarSlot>
  )
}
