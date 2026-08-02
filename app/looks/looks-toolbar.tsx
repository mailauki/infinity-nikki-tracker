'use client'

import Link from 'next/link'
import { Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ToolbarSlot from '@/components/navbar/toolbar-slot'

export default function LooksToolbar({ atLimit }: { atLimit: boolean }) {
  return (
    <ToolbarSlot>
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
    </ToolbarSlot>
  )
}
