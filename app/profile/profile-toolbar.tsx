'use client'
import ToolbarSlot from '@/components/toolbar-slot'
import { AdminPanelSettings } from '@mui/icons-material'
import { Chip } from '@mui/material'
import Link from 'next/link'

export default function ProfileToolbar({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <ToolbarSlot>
      {isAdmin && (
        <Chip
          clickable
          color="secondary"
          component={Link}
          href="/admin"
          icon={<AdminPanelSettings />}
          label="Admin access"
          variant="outlined"
        />
      )}
    </ToolbarSlot>
  )
}
